package com.example.demo.controller;

import java.util.UUID;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.demo.annotations.Admin;
import com.example.demo.entity.Arquivo;
import com.example.demo.service.ArquivoService;

@Admin
@RestController
@RequestMapping("/admin/arquivos")
public class ArquivoController {

    private final ArquivoService arquivoService;

    public ArquivoController(ArquivoService arquivoService) {
        this.arquivoService = arquivoService;
    }

    @GetMapping("/{id}")
    public ResponseEntity<byte[]> baixar(@PathVariable UUID id) {
        Arquivo arquivo = arquivoService.buscarPorId(id);
        byte[] conteudo = arquivoService.lerConteudo(arquivo);

        MediaType mediaType;
        try {
            mediaType = MediaType.parseMediaType(arquivo.getTipo());
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + arquivo.getNome() + "\"")
                .body(conteudo);
    }
}
