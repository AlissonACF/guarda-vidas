package com.example.demo.config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.example.demo.entity.Posto;
import com.example.demo.entity.Usuario;
import com.example.demo.enums.NivelAcesso;
import com.example.demo.enums.PostoStatus;
import com.example.demo.repository.PostoRepository;
import com.example.demo.repository.UsuarioRepository;

@Configuration
public class DataInitializer {

    private static final int TOTAL_POSTOS_ATIVOS = 21;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(PasswordEncoder passwordEncoder) {
        this.passwordEncoder = passwordEncoder;
    }

    @Bean
    public CommandLineRunner initDatabase(UsuarioRepository repository) {
        return args -> {
            // Garante que o admin sempre existe com as credenciais corretas
            repository.findByEmail("admin@admin.com").ifPresentOrElse(
                admin -> {
                    // Admin já existe — não altera nada
                    System.out.println("Usuário ADMIN já existe no banco. Credenciais mantidas.");
                },
                () -> {
                    Usuario admin = new Usuario();
                    admin.setEmail("admin@admin.com");
                    admin.setNivelAcesso(NivelAcesso.ADMIN);
                    admin.setSenha(passwordEncoder.encode("123456789"));
                    repository.save(admin);
                    System.out.println("Usuário ADMIN criado: admin@admin.com / 123456789");
                }
            );
        };
    }

    @Bean
    public CommandLineRunner initPostos(PostoRepository postoRepository) {
        return args -> {
            List<Posto> postos = postoRepository.findTodosOrderByIdAsc();
            long ativos = postos.stream().filter(Posto::isAtivo).count();

            if (ativos >= TOTAL_POSTOS_ATIVOS) {
                System.out.println("Postos já inicializados (" + ativos + " ativos). Nenhuma alteração feita.");
                return;
            }

            int postosFaltantes = (int)(TOTAL_POSTOS_ATIVOS - ativos);
            for (int i = 0; i < postosFaltantes; i++) {
                int numero = postos.size() + i + 1;
                Posto posto = new Posto();
                posto.setNome("Posto " + numero);
                posto.setDescricao("Posto de guarda-vidas " + numero);
                posto.setStatus(PostoStatus.DISPONIVEL);
                posto.setAtivo(true);
                postoRepository.save(posto);
            }

            System.out.println("Postos criados: agora existem " + TOTAL_POSTOS_ATIVOS + " postos ativos.");
        };
    }
}
