import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, API_ROUTES } from "../services/api";

const STATUS_INFO = {
    DISPONIVEL: { text: "Disponível", color: "bg-green-500", textColor: "text-green-400", borderColor: "border-green-500/30" },
    MANUTENCAO: { text: "Manutenção", color: "bg-yellow-500", textColor: "text-yellow-400", borderColor: "border-yellow-500/30" },
    DESATIVADO: { text: "Desativado", color: "bg-red-500", textColor: "text-red-400", borderColor: "border-red-500/30" },
};

export function Posto() {
    const navigate = useNavigate();
    const [postos, setPostos] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("todos");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        carregarPostos();
    }, []);

    const carregarPostos = async () => {
        setLoading(true);
        setError("");

        try {
            const data = await apiFetch(API_ROUTES.postos);
            setPostos(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const guardarPostoSelecionado = (posto) => {
        localStorage.setItem("selectedPostoId", posto.id);
        localStorage.setItem("selectedPostoNome", posto.nome);
    };

    const postoDisponivel = (posto) => {
        const status = posto.status || "DISPONIVEL";
        if (status !== "DISPONIVEL") {
            alert(`${posto.nome} esta ${STATUS_INFO[status]?.text.toLowerCase() || "indisponível"} no momento.`);
            return false;
        }

        return true;
    };

    const handleCheckin = (posto) => {
        if (!postoDisponivel(posto)) {
            return;
        }

        guardarPostoSelecionado(posto);
        navigate("/checkin", {
            state: {
                postoId: posto.id,
                postoNome: posto.nome,
            },
        });
    };

    const handleCheckout = (posto) => {
        if (!postoDisponivel(posto)) {
            return;
        }

        guardarPostoSelecionado(posto);
        navigate("/checkout", {
            state: {
                postoId: posto.id,
                postoNome: posto.nome,
            },
        });
    };

    const filteredPostos = useMemo(() => {
        const term = searchTerm.toLowerCase();

        return postos.filter((posto) => {
            const status = posto.status || "DISPONIVEL";
            const matchesSearch = posto.nome?.toLowerCase().includes(term) || posto.descricao?.toLowerCase().includes(term);
            const matchesCategory = selectedCategory === "todos" || selectedCategory === status;
            return matchesSearch && matchesCategory;
        });
    }, [postos, searchTerm, selectedCategory]);

    const statusCounts = useMemo(() => {
        return postos.reduce((counts, posto) => {
            const status = posto.status || "DISPONIVEL";
            counts[status] = (counts[status] || 0) + 1;
            return counts;
        }, { DISPONIVEL: 0, MANUTENCAO: 0, DESATIVADO: 0 });
    }, [postos]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950">
            <div className="container mx-auto px-4 py-8">
                <div className="flex justify-end mb-4">
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                        Postos de <span className="text-yellow-500">Guarda-Vidas</span>
                    </h1>
                    <p className="text-blue-200 text-lg">Selecione o posto para realizar o check-in diário.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {Object.entries(STATUS_INFO).map(([status, info]) => (
                        <div key={status} className={`bg-blue-900/40 border ${info.borderColor} rounded-xl p-4 text-center`}>
                            <div className="flex items-center justify-center gap-2 mb-2">
                                <div className={`w-2 h-2 ${info.color} rounded-full`}></div>
                                <span className={`${info.textColor} font-semibold`}>{info.text}</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{statusCounts[status] || 0}</p>
                        </div>
                    ))}
                </div>

                <div className="bg-blue-900/40 border border-blue-800 rounded-xl p-4 mb-6">
                    <div className="flex flex-col md:flex-row gap-4">
                        <input
                            type="text"
                            placeholder="Buscar por nome ou localizacao..."
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            className="flex-1 px-4 py-2 bg-blue-950/50 border border-blue-700 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-yellow-500"
                        />

                        <div className="flex flex-wrap gap-2">
                            <button onClick={() => setSelectedCategory("todos")} className={`px-4 py-2 rounded-lg ${selectedCategory === "todos" ? "bg-yellow-500 text-blue-950 font-semibold" : "bg-blue-950/50 text-blue-200"}`}>
                                Todos
                            </button>
                            {Object.entries(STATUS_INFO).map(([status, info]) => (
                                <button key={status} onClick={() => setSelectedCategory(status)} className={`px-4 py-2 rounded-lg ${selectedCategory === status ? `${info.color} text-white font-semibold` : "bg-blue-950/50 text-blue-200"}`}>
                                    {info.text}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {loading && <p className="text-center text-blue-200 py-12">Carregando postos...</p>}
                {error && <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">{error}</div>}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredPostos.map((posto) => {
                        const status = posto.status || "DISPONIVEL";
                        const statusInfo = STATUS_INFO[status] || STATUS_INFO.DESATIVADO;
                        const disponivel = status === "DISPONIVEL";

                        return (
                            <div key={posto.id} className={`bg-blue-900/40 border rounded-xl p-5 transition-all ${disponivel ? "border-blue-700 hover:border-yellow-500/50" : "border-blue-800/50 opacity-70"}`}>
                                <div className="flex items-center justify-between gap-2 mb-4">
                                    <h3 className="text-white font-bold text-lg">{posto.nome}</h3>
                                    <span className={`text-xs ${statusInfo.textColor}`}>{statusInfo.text}</span>
                                </div>

                                <p className="text-blue-300 text-sm min-h-[40px]">{posto.descricao || "Sem descrição cadastrada."}</p>

                                <div className="grid grid-cols-2 gap-2 mt-4">
                                    <button
                                        onClick={() => handleCheckin(posto)}
                                        disabled={!disponivel}
                                        className={`py-2 rounded-lg font-semibold transition-colors ${disponivel ? "bg-yellow-500 text-blue-950 hover:bg-yellow-400" : "bg-gray-700 text-gray-400 cursor-not-allowed"}`}
                                    >
                                        Check-in
                                    </button>
                                    <button
                                        onClick={() => handleCheckout(posto)}
                                        disabled={!disponivel}
                                        className={`py-2 rounded-lg font-semibold transition-colors ${disponivel ? "bg-green-600 text-white hover:bg-green-500" : "bg-gray-700 text-gray-400 cursor-not-allowed"}`}
                                    >
                                        Checkout
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {!loading && filteredPostos.length === 0 && (
                    <p className="text-center text-blue-200 py-12">Nenhum posto encontrado.</p>
                )}
            </div>
        </div>
    );
}
