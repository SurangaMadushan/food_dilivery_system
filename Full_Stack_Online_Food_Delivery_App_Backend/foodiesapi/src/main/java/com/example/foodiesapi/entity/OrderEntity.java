package com.example.foodiesapi.entity;

import com.example.foodiesapi.io.OrderItem;
import lombok.Builder;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "orders")
@Data
@Builder
public class OrderEntity {
    @Id
    private String id; // This 'id' will be sent to PayHere as the "order_id"

    private String userId;
    private String userAddress;
    private String phoneNumber;
    private String email;

    private List<OrderItem> orderedItems;
    private double amount;
    private String currency; // Added: e.g., "LKR"

    private String paymentStatus; // e.g., "Pending", "Success", "Failed"
    private String orderStatus;   // e.g., "Placed", "Preparing", "Delivered"

    // --- PayHere Specific Fields ---
    private String payherePaymentId; // Stores the "payment_id" sent by PayHere

    // Optional: Store the raw status message from PayHere for debugging
    // private String payhereStatusMessage;
}