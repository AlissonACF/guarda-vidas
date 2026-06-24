export function isCameraSupported() {
    return Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

export function isSecureCameraContext() {
    return window.isSecureContext || ["localhost", "127.0.0.1"].includes(window.location.hostname);
}

export async function requestCameraStream() {
    if (!isCameraSupported()) {
        throw new Error("Este navegador nao oferece acesso a camera.");
    }

    if (!isSecureCameraContext()) {
        throw new Error("A camera so funciona em HTTPS, localhost ou 127.0.0.1.");
    }

    try {
        return await navigator.mediaDevices.getUserMedia({
            video: {
                facingMode: { ideal: "environment" },
            },
            audio: false,
        });
    } catch (error) {
        if (error.name === "OverconstrainedError" || error.name === "NotFoundError") {
            return navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        }

        if (error.name === "NotAllowedError") {
            throw new Error("Permissao para usar a camera negada. Libere o acesso no navegador.");
        }

        throw new Error("Nao foi possivel acessar a camera deste dispositivo.");
    }
}

export function stopCameraStream(stream) {
    if (stream) {
        stream.getTracks().forEach((track) => track.stop());
    }
}
