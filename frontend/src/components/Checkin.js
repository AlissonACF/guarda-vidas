import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { apiFetch, API_ROUTES } from "../services/api";
import { requestCameraStream, stopCameraStream } from "../utils/camera";

export function Checkin() {
    const navigate = useNavigate();
    const location = useLocation();
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const streamRef = useRef(null);

    const [postoId, setPostoId] = useState(null);
    const [postoNome, setPostoNome] = useState("");
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
                if (!videoRef.current) {
                    return;
                }

                videoRef.current.srcObject = stream;
                await videoRef.current.play();
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
            setError("A câmera ainda está iniciando. Tente novamente em instantes.");
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

            const arquivoFoto = new File([blob], `checkin_${postoId}_${Date.now()}.jpg`, { type: "image/jpeg" });
            const previewUrl = URL.createObjectURL(blob);

            setFoto(arquivoFoto);
            setPreviewFoto(previewUrl);
            fecharCamera();
            setEtapa("preview");
        }, "image/jpeg", 0.9);
    };

    const refazerFoto = () => {
        if (previewFoto) {
            URL.revokeObjectURL(previewFoto);
        }

        setFoto(null);
        setPreviewFoto(null);
        setEtapa("form");
    };

    const handleSubmit = async () => {
        if (!postoId) {
            setError("Nenhum posto selecionado. Volte e escolha um posto.");
            return;
        }

        if (!foto) {
            setError("Tire uma foto antes de confirmar o check-in.");
            return;
        }

        const formData = new FormData();
        formData.append("postoId", String(postoId));
        formData.append("foto", foto);

        setLoading(true);
        setError("");
        setMessage("");

        try {
            await apiFetch(API_ROUTES.checkin, {
                method: "POST",
                body: formData,
            });

            localStorage.removeItem("selectedPostoId");
            localStorage.removeItem("selectedPostoNome");
            setMessage("Check-in realizado com sucesso.");

            setTimeout(() => navigate("/checkout", {
                state: { postoId, postoNome },
            }), 900);
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
                        Check-in <span className="text-yellow-500">{postoNome}</span>
                    </h1>
                    <p className="text-blue-200">Registre sua presença com foto no posto.</p>
                </div>

                <canvas ref={canvasRef} className="hidden" />

                {etapa === "form" && (
                    <div className="bg-blue-950/40 backdrop-blur-md border border-blue-800 rounded-2xl p-6 md:p-8 shadow-2xl">
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-bold text-white mb-2">Foto de check-in</h2>
                            <p className="text-blue-200 text-sm">Posto ID: <span className="text-yellow-500 font-semibold">{postoId || "-"}</span></p>
                        </div>

                        <button
                            type="button"
                            onClick={abrirCamera}
                            disabled={!postoId}
                            className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 text-blue-950 font-bold py-4 rounded-lg transition-all duration-300 hover:scale-105 disabled:opacity-60"
                        >
                            Abrir câmera e tirar foto
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate("/postos")}
                            className="w-full mt-3 border border-blue-700 text-blue-200 font-semibold py-3 rounded-lg hover:border-yellow-500 hover:text-yellow-500 transition-colors"
                        >
                            Voltar para postos
                        </button>
                    </div>
                )}

                {etapa === "camera" && (
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
                )}

                {etapa === "preview" && (
                    <div className="bg-blue-950/40 backdrop-blur-md border border-blue-800 rounded-2xl p-6 md:p-8 shadow-2xl">
                        <img src={previewFoto} alt="Preview do check-in" className="w-full h-auto max-h-[420px] object-cover rounded-xl border-2 border-yellow-500/50 mb-4" />

                        <div className="flex gap-3 mb-4">
                            <button type="button" onClick={refazerFoto} className="flex-1 bg-yellow-500 text-blue-950 font-semibold py-3 rounded-lg hover:bg-yellow-400 transition-colors">
                                Refazer foto
                            </button>
                            <button type="button" onClick={() => navigate("/postos")} className="flex-1 bg-red-600 text-white font-semibold py-3 rounded-lg hover:bg-red-500 transition-colors">
                                Cancelar
                            </button>
                        </div>

                        <button type="button" onClick={handleSubmit} disabled={loading} className="w-full bg-green-600 text-white font-bold py-3 rounded-lg hover:bg-green-500 transition-colors disabled:opacity-60">
                            {loading ? "Enviando..." : "Confirmar check-in"}
                        </button>
                    </div>
                )}

                {message && <div className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-lg text-green-300">{message}</div>}
                {error && <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300">{error}</div>}
            </div>
        </div>
    );
}
