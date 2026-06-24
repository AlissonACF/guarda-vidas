package com.example.demo.controller;

import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.annotations.Public;
import com.example.demo.config.JwtUtil;
import com.example.demo.dto.AuthDTO;
import com.example.demo.dto.RecuperacaoSolicitacaoDTO;
import com.example.demo.dto.RecuperarSenhaDTO;
import com.example.demo.entity.Usuario;
import com.example.demo.repository.UsuarioRepository;
import com.example.demo.service.UsuarioService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/auth")
public class AuthController {

    @Autowired
    private UsuarioRepository usuarioRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private UsuarioService usuarioService;

    /**
     * Login unificado:
     * - Admin: usa email (admin@admin.com) + senha
     * - Usuário comum: usa CPF (11 dígitos) como "email" + primeiros 4 dígitos como senha
     *   O frontend envia o CPF no campo email; o backend detecta pelo formato.
     */
    @PostMapping("/login")
    @Public
    public ResponseEntity<?> login(@RequestBody @Valid AuthDTO dto) {
        String identificador = dto.getEmail();
        String senha = dto.getSenha();

        Optional<Usuario> usuarioOpt;

        // Se o identificador for apenas dígitos com 11 caracteres, é um CPF
        if (identificador.matches("\\d{11}")) {
            usuarioOpt = usuarioRepository.findByCpf(identificador);
        } else {
            usuarioOpt = usuarioRepository.findByEmail(identificador);
        }

        if (usuarioOpt.isPresent() && passwordEncoder.matches(senha, usuarioOpt.get().getSenha())) {
            String nivelAcesso = usuarioOpt.get().getNivelAcesso().toString();
            String tokenSubject = usuarioOpt.get().getEmail();

            String token = jwtUtil.generateToken(tokenSubject, nivelAcesso);

            return ResponseEntity.ok(Map.of(
                "token", token,
                "tipo", nivelAcesso
            ));
        }

        return ResponseEntity.status(401).body("Credenciais inválidas!");
    }

    @GetMapping("/ping")
    @Public
    public void pong() {
    }

    @Public
    @PostMapping("/recuperar-senha/solicitar")
    public ResponseEntity<?> solicitarCodigo(@RequestBody @Valid RecuperacaoSolicitacaoDTO dto) {
        usuarioService.solicitarCodigo(dto);
        return ResponseEntity.ok(Map.of("message", "E-mail enviado com sucesso!"));
    }

    @Public
    @PostMapping("/recuperar-senha/alterar")
    public ResponseEntity<?> alterarSenha(@RequestBody @Valid RecuperarSenhaDTO dto) {
        usuarioService.trocarSenha(dto);
        return ResponseEntity.ok(Map.of("message", "Senha alterada com sucesso!"));
    }
}
