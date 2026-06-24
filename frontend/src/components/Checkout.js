import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch, API_ROUTES } from "../services/api";
import { requestCameraStream, stopCameraStream } from "../utils/camera";

export function Checkout() {
    const navigate = useNavigate();
    const location = useLocation();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [postoId, setPostoId] = useState(null);
    const [postoNome, setPostoNome] = useState("");
    const [prevencoes, setPrevencoes] = useState("");
    const [lesoes, setLesoes] = useState("");
    const [etapa, setEtapa] = useState("form");
    const [foto, setFoto] = useState(null);
    const [previewFoto, setPreviewFoto] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const selectedPostoId = location.state?.postoId || localStorage.getItem("selectedPostoId");
        const selectedPostoNome = location.state?.postoNome || localStorage.getItem("selectedPostoNome");

        if (!selectedPostoId) {
            setError("Nenhum posto selecionado. Volte e escolha um posto.");
            return;
        }

        setPostoId(Number(selectedPostoId));
        setPostoNome(selectedPostoNome || `Posto ${selectedPostoId}`);
    }, [location.state]);

    useEffect(() => {
        return () => {
            stopCameraStream(streamRef.current);
            if (previewFoto) {
                URL.revokeObjectURL(previewFoto);
            }
        };
    }, [previewFoto]);

    const abrirCamera = async () => {
        setError("");
        setEtapa("camera");

        try {
            const stream = await requestCameraStream();
            streamRef.current = stream;

            setTimeout(async () => {
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    await videoRef.current.play();
                }
            }, 0);
        } catch (err) {
            stopCameraStream(streamRef.current);
            streamRef.current = null;
            setEtapa("form");
            setError(err.message);
        }
    };

    const fecharCamera = () => {
        stopCameraStream(streamRef.current);
        streamRef.current = null;
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const tirarFoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;

        if (!video || !canvas || video.readyState < 2) {
            setError("A câmera ainda esta iniciando. Tente novamente em instantes.");
            return;
        }

        canvas.width = video.videoWidth || 1280;
        canvas.height = video.videoHeight || 720;
        canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);

        canvas.toBlob((blob) => {
            if (!blob) {
                setError("Não foi possível capturar a foto.");
                return;
            }

            const arquivoFoto = new File([blob], `checkout_${postoId}_${Date.now()}.jpg`, { type: "image/jpeg" });
            setFoto(arquivoFoto);
            setPreviewFoto(URL.createObjectURL(blob));
            fecharCamera();
            setEtapa("form");
        }, "image/jpeg", 0.9);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!foto) {
            setError("Tire uma foto antes de finalizar o checkout.");
            return;
        }

        const formData = new FormData();
        formData.append("postoId", String(postoId));
        formData.append("prevenções", String(prevencoes));
        formData.append("lesões", String(lesoes));
        formData.append("foto", foto);

        setLoading(true);
        setError("");
        setMessage("");

        try {
            await apiFetch(API_ROUTES.checkout, {
                method: "POST",
                body: formData,
            });

            localStorage.removeItem("selectedPostoId");
            localStorage.removeItem("selectedPostoNome");
            setMessage("Checkout realizado com sucesso.");
            setTimeout(() => navigate("/postos"), 900);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                        Checkout <span className="text-yellow-500">{postoNome}</span>
                    </h1>
                    <p className="text-blue-200">Informe os totais do turno e registre a foto final.</p>
                </div>

                <canvas ref={canvasRef} className="hidden" />

                {etapa === "camera" ? (
                    <div className="bg-blue-950/40 backdrop-blur-md border border-blue-800 rounded-2xl p-6 md:p-8 shadow-2xl">
                        <div className="bg-black rounded-xl overflow-hidden mb-4">
                            <video ref={videoRef} autoPlay playsInline muted className="w-full h-auto max-h-[500px] object-cover" />
                        </div>
                        <div className="flex gap-3">
                            <button type="button" onClick={tirarFoto} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-500 transition-colors">
                                Tirar foto
                            </button>
                            <button type="button" onClick={() => { fecharCamera(); setEtapa("form"); }} className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-500 transition-colors">
                                Cancelar
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="bg-blue-950/40 backdrop-blur-md border border-blue-800 rounded-2xl p-6 md:p-8 shadow-2xl space-y-5">
                        <div>
                            <label className="block text-blue-200 text-sm font-medium mb-2">Prevenções</label>
                            <input
                                type="number"
                                min="0"
                                value={prevencoes}
                                onChange={(event) => setPrevencoes(event.target.value)}
                                required
                                className="w-full px-4 py-3 bg-blue-900/50 border border-blue-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                            />
                        </div>

                        <div>
                            <label className="block text-blue-200 text-sm font-medium mb-2">Lesões</label>
                            <input
                                type="number"
                                min="0"
                                value={lesoes}
                                onChange={(event) => setLesoes(event.target.value)}
                                required
                                className="w-full px-4 py-3 bg-blue-900/50 border border-blue-700 rounded-lg text-white focus:outline-none focus:border-yellow-500"
                            />
                        </div>

                        {previewFoto && (
                            <img src={previewFoto} alt="Preview do checkout" className="w-full h-auto max-h-[360px] object-cover rounded-xl border-2 border-yellow-500/50" />
                        )}

                        <button type="button" onClick={abrirCamera} className="w-full bg-yellow-500 text-blue-950 font-bold py-3 rounded-lg hover:bg-yellow-400 transition-colors">
                            {foto ? "Refazer foto" : "Abrir câmera e tirar foto"}
                        </button>

                        <button type="submit" disabled={loading || !postoId} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-500 transition-colors disabled:opacity-60">
                            {loading ? "Enviando..." : "Confirmar checkout"}
                        </button>
                    </form>
                )}

                {message && <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300">{message}</div>}
                {error && <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">{error}</div>}
            </div>
        </div>
    );
}
