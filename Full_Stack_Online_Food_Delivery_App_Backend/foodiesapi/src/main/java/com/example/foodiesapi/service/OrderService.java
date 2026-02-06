package com.example.foodiesapi.service;

import com.example.foodiesapi.io.OrderRequest;
import com.example.foodiesapi.io.OrderResponse;

import java.util.List;
import java.util.Map;

public interface OrderService {

    // --- New PayHere Methods ---

    /**
     * Generates the PayHere hash and returns the payment data needed for the frontend.
     */
    Map<String, Object> initiatePayHereCheckout(OrderRequest request);

    /**
     * Handles the callback from PayHere to update the order status to "Paid".
     */
    void handlePayHereNotification(Map<String, String> paymentData);


    // --- Standard Order Methods ---

    List<OrderResponse> getUserOrders();

    void removeOrder(String orderId);

    List<OrderResponse> getOrdersOfAllUsers();

    void updateOrderStatus(String orderId, String status);
}