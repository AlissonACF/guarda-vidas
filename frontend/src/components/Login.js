import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { API_ROUTES, API_URL } from "../services/api";
import { getDefaultAuthenticatedRoute, saveAuth } from "../services/auth";

export function Login() {
    const navigate = useNavigate();
    const location = useLocation();
    const [identificador, setIdentificador] = useState("");
    const [senha, setSenha] = useState("");
    const [mostrarSenha] = useState(false);
    const [loading, setLoading] = useState(false);
    const [serverUrl] = useState(localStorage.getItem("serverUrl") || API_URL);
    const [error, setError] = useState("");

    // Detecta se o campo contém apenas dígitos (CPF) ou email (admin)
    const isAdmin = identificador.includes("@") || (identificador.length > 0 && !/^\d+$/.test(identificador));
    const isCpf = /^\d+$/.test(identificador);

    // Formata CPF para exibição: 000.000.000-00
    const formatarCpf = (valor) => {
        const digitos = valor.replace(/\D/g, "").slice(0, 11);
        if (digitos.length <= 3) return digitos;
        if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
        if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
        return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
    };

    const handleIdentificadorChange = (event) => {
        const valor = event.target.value;
        // Se começa com dígitos, formata como CPF
        if (/^\d/.test(valor) || valor === "") {
            const digitos = valor.replace(/\D/g, "").slice(0, 11);
            setIdentificador(digitos);
        } else {
            setIdentificador(valor);
        }
    };

    const fazerLogin = async (event) => {
        event.preventDefault();
        setLoading(true);
        setError("");

        const baseUrl = serverUrl.replace(/\/$/, "");
        localStorage.setItem("serverUrl", baseUrl);

        try {
            const response = await fetch(`${baseUrl}${API_ROUTES.login}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: identificador, senha }),
            });

            if (!response.ok) {
                throw new Error("CPF/email ou senha inválidos.");
            }

            const data = await response.json();
            saveAuth(data.token, data.tipo);

            const defaultRoute = getDefaultAuthenticatedRoute(data.tipo);
            const requestedRoute = location.state?.from?.pathname;
            const canAccessRequestedRoute =
                (data.tipo === "ADMIN" && requestedRoute === "/dashboard") ||
                (data.tipo === "PADRAO" && ["/postos", "/checkin", "/checkout"].includes(requestedRoute));

            navigate(canAccessRequestedRoute ? requestedRoute : defaultRoute, { replace: true });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const cpfFormatado = isCpf ? formatarCpf(identificador) : identificador;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 flex items-center justify-center px-4">
            <div className="relative z-10 w-full max-w-md">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-2xl mb-4 shadow-lg">
                        <svg className="w-10 h-10 text-blue-950" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                        </svg>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">Life<span className="text-yellow-500">Guard</span></h2>
                    <p className="text-blue-200 text-sm">Sistema do Corpo de Bombeiros</p>
                </div>

                <div className="bg-blue-950/40 backdrop-blur-md border border-blue-800 rounded-2xl p-8 shadow-2xl">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-semibold text-white">Acesso ao Sistema</h3>
                    </div>

                    <form onSubmit={fazerLogin} className="space-y-5">
                        <div>
                            <label className="block text-blue-200 text-sm font-medium mb-2">
                                {isCpf ? "CPF" : isAdmin ? "Email (Admin)" : "CPF ou Email"}
                            </label>
                            <input
                                type="text"
                                value={isCpf ? cpfFormatado : identificador}
                                placeholder="CPF (guarda-vidas) ou email (admin)"
                                onChange={handleIdentificadorChange}
                                className="w-full px-4 py-3 bg-blue-900/50 border border-blue-700 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-yellow-500"
                                required
                            />
                            {isCpf && identificador.length > 0 && identificador.length < 11 && (
                                <p className="text-yellow-400 text-xs mt-1">CPF: {identificador.length}/11 dígitos</p>
                            )}
                        </div>

                        <div>
                            <label className="block text-blue-200 text-sm font-medium mb-2">Senha</label>
                            {isCpf && (
                                <p className="text-blue-400 text-xs mb-2">Guarda-vidas: senha são os 4 primeiros dígitos do CPF</p>
                            )}
                            <div className="flex gap-2">
                                <input
                                    type={mostrarSenha ? "text" : "password"}
                                    value={senha}
                                    placeholder={isCpf ? "4 primeiros dígitos do CPF" : "Digite sua senha"}
                                    onChange={(e) => setSenha(e.target.value)}
                                    className="flex-1 px-4 py-3 bg-blue-900/50 border border-blue-700 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-yellow-500"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-blue-950 font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-70"
                        >
                            {loading ? "Autenticando..." : "Fazer login"}
                        </button>

                        <div className="p-3 bg-blue-900/30 rounded-lg border border-blue-800">
                            <p className="text-xs text-blue-300 text-center">
                                Admin: admin@admin.com | Guarda-vidas: use seu CPF
                            </p>
                        </div>
                    </form>

                    {error && (
                        <div className="mt-4 p-3 bg-blue-900/30 border border-blue-700 rounded-lg text-blue-100 text-sm">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
