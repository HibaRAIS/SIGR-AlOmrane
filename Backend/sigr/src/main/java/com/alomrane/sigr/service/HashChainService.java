package com.alomrane.sigr.service;

import com.alomrane.sigr.model.JournalMouvement;
import com.alomrane.sigr.model.LigneMouvement;
import com.alomrane.sigr.util.HashUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.format.DateTimeFormatter;
import java.util.Comparator;
import java.util.Objects;

@Service
@Slf4j
public class HashChainService {

    private static final DateTimeFormatter DATE_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSSSSS");

    public String calculerHash(JournalMouvement journal, LigneMouvement ligne, String previousHash) {
        String data = previousHash
                + formatDate(journal)
                + journal.getType()
                + Objects.toString(journal.getReferenceDocument(), "")
                + ligne.getProduit().getId()
                + formatBigDecimal(ligne.getQuantite())
                + formatBigDecimal(ligne.getPmpSnapshot())
                + formatBigDecimal(ligne.getValeurFlux())
                + journal.getUtilisateur().getLoginLdap()
                + journal.getCodeUnique();

        // Log temporaire pour diagnostic – à retirer après résolution
        log.info("HASH DATA for {} : '{}'", journal.getCodeUnique(), data);

        return HashUtil.sha256(data);
    }

    public LigneMouvement getPremiereLigne(JournalMouvement journal) {
        return journal.getLignes().stream()
                .min(Comparator.comparing(LigneMouvement::getId))
                .orElseThrow(() -> new IllegalStateException(
                        "Journal sans ligne : " + journal.getCodeUnique()));
    }

    private String formatDate(JournalMouvement journal) {
        return journal.getDateMouvement().format(DATE_FORMAT);
    }

    private String formatBigDecimal(BigDecimal value) {
        if (value == null) {
            return "0";
        }
        return value.stripTrailingZeros().toPlainString();
    }
}