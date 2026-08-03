// BulkDeleteRequest.java
package com.alomrane.sigr.dto.request;



import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import java.util.List;

@Data
public class BulkDeleteRequest {

    @NotEmpty(message = "La liste des IDs ne peut pas être vide")
    private List<Long> ids;
}
