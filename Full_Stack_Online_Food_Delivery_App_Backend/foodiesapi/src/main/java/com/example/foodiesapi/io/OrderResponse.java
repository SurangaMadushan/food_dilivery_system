package com.example.foodiesapi.io;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class OrderResponse {
    private String id;
    private String userId;
    private String userAddress;
    private String phoneNumber;
    private String email;

    private double amount;
    private String currency; // Added: Helpful to show "LKR" on the frontend

    private String paymentStatus;
    private String orderStatus;

    // We removed razorpayOrderId because PayHere uses our database ID ('id' above)
    // as the order reference, so no separate external ID is needed in the response.

    private List<OrderItem> orderedItems;
}