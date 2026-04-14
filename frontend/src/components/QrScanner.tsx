import { useEffect, useState, useRef } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import axios from "axios";

export default function UserScanner() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
    }

    const scanner = new Html5QrcodeScanner(
      "reader",
      {
        fps: 10,
        qrbox: 250,
        rememberLastUsedCamera: true,
      },
      false
    );

    scannerRef.current = scanner;

    scanner.render(async (decodedText) => {
      if (loading || user) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const res = await axios.get(
          `http://localhost:5000/api/users/${decodedText.trim()}`
        );
        setUser(res.data);
        await scanner.clear();
      } catch (err) {
        console.log(err);
        setError("Utilisateur non trouvé");
        setUser(null);
      } finally {
        setLoading(false);
      }
    }, () => {});

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  const handleReset = () => {
    setUser(null);
    setError(null);
    setLoading(false);
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white py-12 px-4">
      <div className="max-w-md mx-auto">
        {/* En-tête */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-4 shadow-sm">
            <span className="text-3xl">📷</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Scanner QR Code
          </h1>
          <p className="text-sm text-gray-500">
            Scannez votre code pour valider votre identité
          </p>
        </div>

        {/* Zone de scan */}
        <div className="bg-white rounded-2xl shadow-lg p-5 mb-4 border border-gray-100">
          <div className="flex justify-center">
            <div id="reader" className="w-[300px]" />
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <span className="text-blue-700 text-sm font-medium">
                Scan en cours...
              </span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-center gap-2">
              <span className="text-red-500">⚠️</span>
              <span className="text-red-700 text-sm font-medium">{error}</span>
            </div>
          </div>
        )}

        {/* Résultat utilisateur */}
        {user && (
          <div className="mt-6">
            {/* Badge succès */}
            <div className="bg-green-50 border border-green-200 rounded-xl p-3 mb-4">
              <div className="flex items-center justify-center gap-2">
                <span className="text-green-500 text-lg">✓</span>
                <span className="text-green-700 text-sm font-medium">
                  Scan réussi !
                </span>
              </div>
            </div>

            {/* Carte utilisateur */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-100">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-3">
                <h3 className="text-white font-semibold flex items-center gap-2">
                  <span>👤</span>
                  Informations utilisateur
                </h3>
              </div>
              <div className="p-5 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-gray-500 text-sm font-medium">Nom</span>
                  <span className="text-gray-800 font-semibold">
                    {user.first_name}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <span className="text-gray-500 text-sm font-medium">Prénom</span>
                  <span className="text-gray-800 font-semibold">
                    {user.last_name}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 text-sm font-medium">Email</span>
                  <span className="text-gray-800 text-sm">
                    {user.email}
                  </span>
                </div>
                {user.student_id && (
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-gray-500 text-sm font-medium">
                      ID Étudiant
                    </span>
                    <span className="text-blue-600 font-mono text-sm font-medium">
                      {user.student_id}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Bouton reset */}
            <button
              onClick={handleReset}
              className="w-full mt-5 px-4 py-3 bg-gray-800 hover:bg-gray-900 text-white font-medium rounded-xl transition-all duration-200 shadow-md flex items-center justify-center gap-2"
            >
              <span>🔄</span>
              Scanner un autre code
            </button>
          </div>
        )}

        {/* Instructions */}
        {!user && !loading && !error && (
          <div className="text-center mt-6">
            <p className="text-gray-400 text-xs">
              Placez le QR code dans le cadre de la caméra
            </p>
          </div>
        )}
      </div>
    </div>
  );
}