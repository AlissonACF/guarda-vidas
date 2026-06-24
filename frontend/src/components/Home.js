export function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-blue-950">
            {/* Container principal */}
            <div className="relative overflow-hidden">
                {/* Elementos decorativos de fundo */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-yellow-500 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-600 rounded-full blur-3xl"></div>
                </div>

                {/* Conteúdo principal */}
                <div className="relative z-10 container mx-auto px-4 py-20">
                    {/* Badge superior */}
                    <div className="flex justify-center mb-8">
                        <div className="inline-flex items-center gap-2 bg-yellow-500/10 backdrop-blur-sm border border-yellow-500/30 rounded-full px-4 py-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                            <span className="text-yellow-500 text-sm font-semibold tracking-wide">
                                GUARDA COSTEIRA • SC
                            </span>
                        </div>
                    </div>

                    {/* Título principal */}
                    <div className="text-center mb-12">
                        <h1 className="text-5xl md:text-7xl font-bold mb-6">
                            <span className="text-white drop-shadow-lg">
                                Olá, seja bem-vindo ao
                            </span>
                            <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-yellow-500 to-yellow-600">
                                Life Guard
                            </span>
                        </h1>
                        
                        {/* Linha decorativa */}
                        <div className="flex justify-center items-center gap-3 my-6">
                            <div className="h-px w-16 bg-gradient-to-r from-transparent to-yellow-500"></div>
                            <div className="w-2 h-2 bg-yellow-500 rotate-45"></div>
                            <div className="h-px w-16 bg-gradient-to-l from-transparent to-yellow-500"></div>
                        </div>

                        {/* Subtítulo */}
                        <p className="text-blue-100 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                            Sistema integrado de gestão e monitoramento para 
                            <span className="text-yellow-400 font-semibold"> operações de salvamento</span> e 
                            <span className="text-yellow-400 font-semibold"> proteção costeira</span>
                        </p>
                    </div>

                    {/* Cards de informações */}
                    <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto mt-16">
                        <div className="bg-blue-900/40 backdrop-blur-sm border border-blue-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all duration-300 group">
                            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-500/20 transition-colors">
                                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                </svg>
                            </div>
                            <h3 className="text-white font-semibold text-lg mb-2">Monitoramento em Tempo Real</h3>
                            <p className="text-blue-200 text-sm">Acompanhamento instantâneo das operações e ocorrências em todo litoral catarinense</p>
                        </div>

                        <div className="bg-blue-900/40 backdrop-blur-sm border border-blue-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all duration-300 group">
                            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-500/20 transition-colors">
                                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </div>
                            <h3 className="text-white font-semibold text-lg mb-2">Segurança Garantida</h3>
                            <p className="text-blue-200 text-sm">Tecnologia avançada para proteção de banhistas e suporte às equipes de salvamento</p>
                        </div>

                        <div className="bg-blue-900/40 backdrop-blur-sm border border-blue-800 rounded-xl p-6 hover:border-yellow-500/50 transition-all duration-300 group">
                            <div className="w-12 h-12 bg-yellow-500/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-yellow-500/20 transition-colors">
                                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-white font-semibold text-lg mb-2">Resposta Rápida</h3>
                            <p className="text-blue-200 text-sm">Alertas instantâneos e coordenação eficiente entre as bases dos bombeiros</p>
                        </div>
                    </div>

                    {/* Rodapé com estatísticas */}
                    <div className="mt-20 pt-8 border-t border-blue-800/50">
                    </div>
                </div>
            </div>
        </div>
    );
}