package com.cargarage.backend.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.ForeignKey;
import jakarta.persistence.Index;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@Entity
@Table(
        name = "facelift_kits",
        // Fast lookup: "which kits fit a Hyundai Creta?"
        indexes = @Index(name = "idx_facelift_kits_make_model", columnList = "car_make, car_model")
)
public class FaceliftKit extends BaseEntity {

    @Column(name = "kit_name", nullable = false, length = 100)
    private String kitName;             // e.g. Creta Front Bumper Kit

    // A kit fits every car of this make and model, so it's matched by name, not linked to one car row
    @Column(name = "car_make", nullable = false, length = 50)
    private String carMake;             // e.g. Hyundai

    @Column(name = "car_model", nullable = false, length = 50)
    private String carModel;            // e.g. Creta

    @Column(nullable = false, length = 500)
    private String description;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal price;

    @Column(nullable = false)
    private boolean active = true;

    // Picture links for the kit, kept in order in their own small table: facelift_kit_images
    @ElementCollection
    @CollectionTable(name = "facelift_kit_images",
            joinColumns = @JoinColumn(name = "kit_id",
                    foreignKey = @ForeignKey(name = "fk_facelift_kit_images_kit")))
    @OrderColumn(name = "position")
    @Column(name = "image_url", nullable = false, length = 500)
    private List<String> imageUrls = new ArrayList<>();
}