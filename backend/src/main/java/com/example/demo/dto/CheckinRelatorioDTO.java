package com.example.demo.dto;

import java.time.LocalDateTime;
import java.util.UUID;

import lombok.Data;

@Data
public class CheckinRelatorioDTO {
    private Long id;
    private Long postoId;
    private String postoNome;
    private String guardaVidasEmail;
    private LocalDateTime horario;
    private String fotoNome;
    private UUID fotoId;
}
