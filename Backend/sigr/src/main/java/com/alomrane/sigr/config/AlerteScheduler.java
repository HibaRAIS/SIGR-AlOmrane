package com.alomrane.sigr.config;

import com.alomrane.sigr.service.AlerteGenerationService;
import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AlerteScheduler {

    private final AlerteGenerationService alerteGenerationService;

    @Scheduled(fixedRate = 60000)
    public void synchroniserAlertes() {
        alerteGenerationService.genererToutesLesAlertes();
    }
}