import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, apiFetchBlob, API_ROUTES } from "../services/api";

const STATUS_OPTIONS = [
    { value: "DISPONIVEL", label: "Disponível" },
    { value: "MANUTENCAO", label: "Manutenção" },
    { value: "DESATIVADO", label: "Desativado" },
];

const formatDateTime = (value) => {
    if (!value) return "Sem horário";
    return new Date(value).toLocaleString("pt-BR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
};

const formatarCpf = (cpf) => {
    if (!cpf || cpf.length !== 11) return cpf;
    return `${cpf.slice(0, 3)}.${cpf.slice(3, 6)}.${cpf.slice(6, 9)}-${cpf.slice(9)}`;
};

// Cache simples em memória para evitar buscar a mesma foto mais de uma vez
const fotoUrlCache = new Map();

function FotoRegistro({ fotoId, fotoNome, onAmpliar }) {
    const [url, setUrl] = useState(() => fotoUrlCache.get(fotoId) || null);
    const [status, setStatus] = useState(url ? "ok" : "carregando");

    useEffect(() => {
        if (!fotoId) {
            setStatus("vazio");
            return;
        }

        const cacheada = fotoUrlCache.get(fotoId);
        if (cacheada) {
            setUrl(cacheada);
            setStatus("ok");
            return;
        }

        let ativo = true;
        setStatus("carregando");

        apiFetchBlob(`${API_ROUTES.arquivos}/${fotoId}`)
            .then((blob) => {
                if (!ativo) return;
                const objectUrl = URL.createObjectURL(blob);
                fotoUrlCache.set(fotoId, objectUrl);
                setUrl(objectUrl);
                setStatus("ok");
            })
            .catch(() => {
                if (ativo) setStatus("erro");
            });

        return () => {
            ativo = false;
        };
    }, [fotoId]);

    if (status === "vazio") {
        return <p className="text-blue-400 text-sm italic">Sem foto</p>;
    }

    if (status === "carregando") {
        return <div className="w-full h-32 rounded-lg bg-blue-950/50 border border-blue-800 animate-pulse" />;
    }

    if (status === "erro") {
        return <p className="text-red-400 text-sm">Não foi possível carregar a foto.</p>;
    }

    return (
        <button
            type="button"
            onClick={() => onAmpliar(url, fotoNome)}
            className="block w-full"
            title="Clique para ampliar"
        >
            <img
                src={url}
                alt={fotoNome || "Foto do registro"}
                className="w-full h-32 object-cover rounded-lg border border-blue-800 hover:opacity-80 transition-opacity"
            />
        </button>
    );
}

function FotoModal({ foto, onClose }) {
    if (!foto) return null;
    return (
        <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={onClose}
        >
            <div className="max-w-3xl max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <img src={foto.url} alt={foto.nome || "Foto do registro"} className="max-w-full max-h-[80vh] rounded-lg" />
                <div className="mt-3 flex items-center justify-between">
                    <p className="text-blue-200 text-sm">{foto.nome}</p>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 bg-yellow-500 text-blue-950 font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
}

export function Dashboard() {
    const [activeTab, setActiveTab] = useState("postos");
    const [postos, setPostos] = useState([]);
    const [checkins, setCheckins] = useState([]);
    const [checkouts, setCheckouts] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [savingId, setSavingId] = useState(null);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [fotoAmpliada, setFotoAmpliada] = useState(null);

    // Estado para cadastro de usuário por CPF
    const [novoCpf, setNovoCpf] = useState("");
    const [cadastrando, setCadastrando] = useState(false);
    const [cadastroResultado, setCadastroResultado] = useState(null);

    const carregarDados = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const [postosData, checkinsData, checkoutsData] = await Promise.all([
                apiFetch(API_ROUTES.postos),
                apiFetch(API_ROUTES.relatorioCheckins),
                apiFetch(API_ROUTES.relatorioCheckouts),
            ]);
            setPostos(postosData);
            setCheckins(checkinsData);
            setCheckouts(checkoutsData);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const carregarUsuarios = useCallback(async () => {
        try {
            const data = await apiFetch("/usuarios/cpf");
            setUsuarios(data);
        } catch (err) {
            setError(err.message);
        }
    }, []);

    useEffect(() => {
        carregarDados();
    }, [carregarDados]);

    useEffect(() => {
        if (activeTab === "usuarios") {
            carregarUsuarios();
        }
    }, [activeTab, carregarUsuarios]);

    const alterarStatus = async (posto, status) => {
        setSavingId(posto.id);
        setError("");
        setMessage("");
        try {
            const atualizado = await apiFetch(`${API_ROUTES.postos}/${posto.id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ nome: posto.nome, descricao: posto.descricao, status }),
            });
            setPostos((current) => current.map((item) => item.id === posto.id ? atualizado : item));
            setMessage(`${posto.nome} atualizado para ${STATUS_OPTIONS.find((o) => o.value === status)?.label}.`);
        } catch (err) {
            setError(err.message);
        } finally {
            setSavingId(null);
        }
    };

    const cadastrarUsuarioCpf = async (event) => {
        event.preventDefault();
        const cpf = novoCpf.replace(/\D/g, "");
        if (cpf.length !== 11) {
            setError("CPF deve ter 11 dígitos.");
            return;
        }
        setCadastrando(true);
        setError("");
        setCadastroResultado(null);
        try {
            const resultado = await apiFetch("/usuarios/cpf", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cpf }),
            });
            setCadastroResultado(resultado);
            setNovoCpf("");
            carregarUsuarios();
        } catch (err) {
            setError(err.message);
        } finally {
            setCadastrando(false);
        }
    };

    const removerUsuario = async (id, cpf) => {
        if (!window.confirm(`Remover guarda-vidas CPF ${formatarCpf(cpf)}?`)) return;
        try {
            await apiFetch(`/usuarios/cpf/${id}`, { method: "DELETE" });
            setUsuarios((current) => current.filter((u) => u.id !== id));
            setMessage("Usuário removido com sucesso.");
        } catch (err) {
            setError(err.message);
        }
    };

    const term = search.toLowerCase();

    const filteredPostos = useMemo(() =>
        postos.filter((p) => p.nome?.toLowerCase().includes(term) || p.descricao?.toLowerCase().includes(term)),
        [postos, term]);

    const filteredCheckins = useMemo(() =>
        checkins.filter((i) => i.postoNome?.toLowerCase().includes(term) || i.guardaVidasEmail?.toLowerCase().includes(term)),
        [checkins, term]);

    const filteredCheckouts = useMemo(() =>
        checkouts.filter((i) => i.postoNome?.toLowerCase().includes(term) || i.guardaVidasEmail?.toLowerCase().includes(term)),
        [checkouts, term]);

    const filteredUsuarios = useMemo(() =>
        usuarios.filter((u) => u.cpf?.includes(term.replace(/\D/g, ""))),
        [usuarios, term]);

    const totalPrevencoes = checkouts.reduce((t, i) => t + (i.prevencoes || 0), 0);
    const totalLesoes = checkouts.reduce((t, i) => t + (i.lesoes || 0), 0);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950">
            <header className="bg-blue-950/80 border-b border-yellow-500/20">
                <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-white">Admin <span className="text-yellow-500">Controle Geral</span></h1>
                        <p className="text-blue-300 text-sm">Gerencie postos, check-ins e guarda-vidas.</p>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8">
                <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ResumoCard label="Postos" value={postos.length} />
                    <ResumoCard label="Check-ins" value={checkins.length} />
                    <ResumoCard label="Prevenções" value={totalPrevencoes} />
                    <ResumoCard label="Lesões" value={totalLesoes} />
                </div>

                <div className="mb-6 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
                    <div className="flex flex-wrap bg-blue-950/60 border border-blue-800 rounded-lg p-1 gap-1">
                        <TabButton active={activeTab === "postos"} onClick={() => setActiveTab("postos")}>Postos</TabButton>
                        <TabButton active={activeTab === "checkins"} onClick={() => setActiveTab("checkins")}>Check-ins</TabButton>
                        <TabButton active={activeTab === "checkouts"} onClick={() => setActiveTab("checkouts")}>Checkouts</TabButton>
                        <TabButton active={activeTab === "usuários"} onClick={() => setActiveTab("usuários")}>Guarda-vidas</TabButton>
                    </div>

                    <div className="flex flex-col md:flex-row gap-3">
                        <input
                            type="text"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Buscar..."
                            className="w-full md:w-72 px-4 py-3 bg-blue-950/50 border border-blue-700 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-yellow-500"
                        />
                        <button onClick={carregarDados} className="px-4 py-3 bg-yellow-500 text-blue-950 rounded-lg font-semibold hover:bg-yellow-400 transition-colors">
                            Atualizar
                        </button>
                    </div>
                </div>

                {message && <div className="mb-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300">{message}</div>}
                {error && <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">{error}</div>}

                {activeTab === "postos" && (
                    <PostosCards loading={loading} postos={filteredPostos} savingId={savingId} alterarStatus={alterarStatus} />
                )}
                {activeTab === "checkins" && (
                    <CheckinsCards
                        loading={loading}
                        checkins={filteredCheckins}
                        onAmpliarFoto={(url, nome) => setFotoAmpliada({ url, nome })}
                    />
                )}
                {activeTab === "checkouts" && (
                    <CheckoutsCards
                        loading={loading}
                        checkouts={filteredCheckouts}
                        onAmpliarFoto={(url, nome) => setFotoAmpliada({ url, nome })}
                    />
                )}
                {activeTab === "usuários" && (
                    <UsuariosTab
                        usuarios={filteredUsuarios}
                        novoCpf={novoCpf}
                        setNovoCpf={setNovoCpf}
                        cadastrando={cadastrando}
                        cadastrarUsuarioCpf={cadastrarUsuarioCpf}
                        cadastroResultado={cadastroResultado}
                        setCadastroResultado={setCadastroResultado}
                        removerUsuario={removerUsuario}
                    />
                )}
            </main>

            <FotoModal foto={fotoAmpliada} onClose={() => setFotoAmpliada(null)} />
        </div>
    );
}

function ResumoCard({ label, value }) {
    return (
        <div className="bg-blue-900/40 border border-blue-800 rounded-xl p-4">
            <p className="text-blue-300 text-sm">{label}</p>
            <p className="text-3xl font-bold text-white">{value}</p>
        </div>
    );
}

function TabButton({ active, onClick, children }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`px-4 py-2 rounded-md font-semibold transition-colors ${active ? "bg-yellow-500 text-blue-950" : "text-blue-200 hover:text-white"}`}
        >
            {children}
        </button>
    );
}

function UsuariosTab({ usuarios, novoCpf, setNovoCpf, cadastrando, cadastrarUsuarioCpf, cadastroResultado, setCadastroResultado, removerUsuario }) {
    const formatarCpfInput = (valor) => {
        const digitos = valor.replace(/\D/g, "").slice(0, 11);
        if (digitos.length <= 3) return digitos;
        if (digitos.length <= 6) return `${digitos.slice(0, 3)}.${digitos.slice(3)}`;
        if (digitos.length <= 9) return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6)}`;
        return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`;
    };

    const handleCpfChange = (e) => {
        const digitos = e.target.value.replace(/\D/g, "").slice(0, 11);
        setNovoCpf(digitos);
    };

    return (
        <div className="space-y-6">
            {/* Cadastro */}
            <div className="bg-blue-900/40 border border-blue-800 rounded-xl p-6">
                <h2 className="text-white font-bold text-lg mb-4">Cadastrar Guarda-vidas por CPF</h2>
                <form onSubmit={cadastrarUsuarioCpf} className="flex flex-col sm:flex-row gap-3">
                    <input
                        type="text"
                        value={formatarCpfInput(novoCpf)}
                        onChange={handleCpfChange}
                        placeholder="000.000.000-00"
                        className="flex-1 px-4 py-3 bg-blue-950/50 border border-blue-700 rounded-lg text-white placeholder-blue-300 focus:outline-none focus:border-yellow-500"
                        required
                    />
                    <button
                        type="submit"
                        disabled={cadastrando || novoCpf.replace(/\D/g, "").length !== 11}
                        className="px-6 py-3 bg-yellow-500 text-blue-950 font-bold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-60"
                    >
                        {cadastrando ? "Cadastrando..." : "Cadastrar"}
                    </button>
                </form>
                <p className="text-blue-400 text-xs mt-2">
                    A senha é gerada automaticamente com os 4 primeiros dígitos do CPF.
                </p>

                {cadastroResultado && (
                    <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-green-300 font-semibold mb-1">Guarda-vidas cadastrado com sucesso!</p>
                        <p className="text-blue-200 text-sm">CPF: <span className="text-white font-mono">{formatarCpf(cadastroResultado.cpf)}</span></p>
                        <p className="text-blue-200 text-sm">Senha gerada: <span className="text-yellow-300 font-bold font-mono">{cadastroResultado.senhaGerada}</span></p>
                        <p className="text-blue-400 text-xs mt-1">Anote a senha — ela não será exibida novamente.</p>
                        <button
                            onClick={() => setCadastroResultado(null)}
                            className="mt-2 text-xs text-blue-400 hover:text-blue-200 underline"
                        >
                            Fechar
                        </button>
                    </div>
                )}
            </div>

            {/* Lista */}
            <div>
                <h2 className="text-white font-bold text-lg mb-4">Guarda-vidas Cadastrados ({usuarios.length})</h2>
                {usuarios.length === 0 ? (
                    <p className="text-blue-300 p-4">Nenhum guarda-vidas cadastrado ainda.</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {usuarios.map((u) => (
                            <div key={u.id} className="bg-blue-900/40 border border-blue-800 rounded-xl p-5 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-white font-mono font-semibold">{formatarCpf(u.cpf)}</p>
                                    <p className="text-blue-400 text-xs">ID #{u.id}</p>
                                </div>
                                <button
                                    onClick={() => removerUsuario(u.id, u.cpf)}
                                    className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors text-sm"
                                >
                                    Remover
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

function PostosCards({ loading, postos, savingId, alterarStatus }) {
    if (loading) return <p className="p-6 text-blue-200">Carregando postos...</p>;
    if (postos.length === 0) return <p className="p-6 text-blue-200">Nenhum posto encontrado.</p>;
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {postos.map((posto) => (
                <article key={posto.id} className="bg-blue-900/40 border border-blue-800 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                            <p className="text-white font-bold text-lg">{posto.nome}</p>
                            <p className="text-blue-300 text-sm">{posto.descricao || "Sem descricao."}</p>
                        </div>
                        <span className="text-xs text-yellow-400">#{posto.id}</span>
                    </div>
                    <label className="block text-blue-200 text-sm font-medium mb-2">Estado do posto</label>
                    <select
                        value={posto.status || "DISPONíVEL"}
                        onChange={(e) => alterarStatus(posto, e.target.value)}
                        disabled={savingId === posto.id}
                        className="w-full px-3 py-2 bg-blue-950/70 border border-blue-700 rounded-lg text-white focus:outline-none focus:border-yellow-500 disabled:opacity-60"
                    >
                        {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                </article>
            ))}
        </section>
    );
}

function CheckinsCards({ loading, checkins, onAmpliarFoto }) {
    if (loading) return <p className="p-6 text-blue-200">Carregando check-ins...</p>;
    if (checkins.length === 0) return <p className="p-6 text-blue-200">Nenhum check-in encontrado.</p>;
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {checkins.map((item) => (
                <article key={item.id} className="bg-blue-900/40 border border-blue-800 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                            <p className="text-white font-bold">{item.guardaVidasEmail}</p>
                            <p className="text-blue-300 text-sm">{item.postoNome || `Posto ${item.postoId || "-"}`}</p>
                        </div>
                        <span className="px-2 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded text-yellow-300 text-xs">Check-in</span>
                    </div>
                    <InfoLine label="Horário" value={formatDateTime(item.horario)} />
                    <InfoLine label="Posto ID" value={item.postoId || "-"} />
                    <div className="mt-3">
                        <p className="text-blue-300 text-sm mb-2">Foto</p>
                        <FotoRegistro fotoId={item.fotoId} fotoNome={item.fotoNome} onAmpliar={onAmpliarFoto} />
                    </div>
                </article>
            ))}
        </section>
    );
}

function CheckoutsCards({ loading, checkouts, onAmpliarFoto }) {
    if (loading) return <p className="p-6 text-blue-200">Carregando checkouts...</p>;
    if (checkouts.length === 0) return <p className="p-6 text-blue-200">Nenhum checkout encontrado.</p>;
    return (
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {checkouts.map((item) => (
                <article key={item.id} className="bg-blue-900/40 border border-blue-800 rounded-xl p-5">
                    <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                            <p className="text-white font-bold">{item.guardaVidasEmail}</p>
                            <p className="text-blue-300 text-sm">{item.postoNome || `Posto ${item.postoId || "-"}`}</p>
                        </div>
                        <span className="px-2 py-1 bg-green-500/10 border border-green-500/30 rounded text-green-300 text-xs">Checkout</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="bg-blue-950/50 border border-blue-800 rounded-lg p-3">
                            <p className="text-blue-300 text-xs">Prevenções</p>
                            <p className="text-green-300 text-2xl font-bold">{item.prevencoes}</p>
                        </div>
                        <div className="bg-blue-950/50 border border-blue-800 rounded-lg p-3">
                            <p className="text-blue-300 text-xs">Lesões</p>
                            <p className="text-red-300 text-2xl font-bold">{item.lesoes}</p>
                        </div>
                    </div>
                    <InfoLine label="Horario" value={formatDateTime(item.horario)} />
                    <InfoLine label="Posto ID" value={item.postoId || "-"} />
                    <div className="mt-3">
                        <p className="text-blue-300 text-sm mb-2">Foto</p>
                        <FotoRegistro fotoId={item.fotoId} fotoNome={item.fotoNome} onAmpliar={onAmpliarFoto} />
                    </div>
                </article>
            ))}
        </section>
    );
}

function InfoLine({ label, value }) {
    return (
        <div className="flex items-start justify-between gap-3 border-b border-blue-800/70 py-2 last:border-b-0">
            <span className="text-blue-300">{label}</span>
            <span className="text-blue-100 text-right break-words">{value}</span>
        </div>
    );
}
