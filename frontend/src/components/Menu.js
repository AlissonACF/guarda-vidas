import { Link, NavLink, useNavigate } from "react-router-dom";
import { clearAuth, getAuthState, getDefaultAuthenticatedRoute } from "../services/auth";

export function Menu() {
    const navigate = useNavigate();
    const { authenticated, role } = getAuthState();

    const logout = () => {
        clearAuth();
        navigate("/");
    };

    return (
        <nav className="bg-blue-950/95 backdrop-blur-sm border-b border-yellow-500/20 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-lg flex items-center justify-center">
                            <NavLink to="/">
                                <svg className="w-5 h-5 text-blue-950" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </NavLink>
                        </div>
                        <NavLink to="/">
                            <span className="text-white font-bold text-lg">
                                Life<span className="text-yellow-500">Guard</span>
                            </span>
                        </NavLink>
                    </div>

                    <div className="flex items-center gap-1">
                        <Link
                            to="/"
                            className="relative group px-4 py-2 rounded-lg text-blue-100 font-medium transition-all duration-300 hover:text-yellow-500"
                        >
                            <span>Inicio</span>
                            <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-yellow-500 transition-all duration-300 group-hover:w-6 group-hover:left-1/2 group-hover:-translate-x-1/2"></span>
                        </Link>

                        {authenticated ? (
                            <>
                                <Link
                                    to={getDefaultAuthenticatedRoute(role)}
                                    className="relative group px-4 py-2 rounded-lg text-blue-100 font-medium transition-all duration-300 hover:text-yellow-500"
                                >
                                    <span>{role === "ADMIN" ? "Dashboard" : "Postos"}</span>
                                    <span className="absolute bottom-0 left-1/2 w-0 h-0.5 bg-yellow-500 transition-all duration-300 group-hover:w-6 group-hover:left-1/2 group-hover:-translate-x-1/2"></span>
                                </Link>
                                <button
                                    type="button"
                                    onClick={logout}
                                    className="ml-2 px-5 py-2 bg-red-500/10 border border-red-500/30 text-red-400 font-bold rounded-lg transition-all duration-300 hover:bg-red-500/20"
                                >
                                    Sair
                                </button>
                            </>
                        ) : (
                            <Link
                                to="/login"
                                className="ml-2 px-5 py-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-blue-950 font-bold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-yellow-500/25"
                            >
                                Login
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}
