package com.example.foodiesapi.service;

import com.example.foodiesapi.io.CartRequest;
import com.example.foodiesapi.io.CartResponse;

public interface CartService {

    CartResponse addToCart(CartRequest request);

    CartResponse getCart();

    void clearCart();

    CartResponse removeFromCart(CartRequest cartRequest);
}
