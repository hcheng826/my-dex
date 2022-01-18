import React from "react";

export function PlaceOrder({ title, orders }) {
  return (
    <div className="container">
        <h3>{title}</h3>
        <div class="input-group mb-3">
            <div class="input-group-prepend">
                <span class="input-group-text">price</span>
            </div>
            <input type="text" class="form-control" aria-label="Amount (to the nearest dollar)"></input>
            <div class="input-group-append">
                <span class="input-group-text">baseToken</span>
            </div>
        </div>
        <div class="input-group mb-3">
            <div class="input-group-prepend">
                <span class="input-group-text">amount</span>
            </div>
            <input type="text" class="form-control" aria-label="Amount (to the nearest dollar)"></input>
            <div class="input-group-append">
                <span class="input-group-text">tradeToken</span>
            </div>
        </div>
        <div className="mx-auto">
            <button type="button" class="btn btn-primary">{title}</button>
        </div>
    </div>
  );
}
