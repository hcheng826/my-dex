import React from "react";

export function PlaceOrder({ action, placeOrder, approve, isApproved }) {
  return (
    <div className="container">
        <h3>{action}</h3>
        <form
            onSubmit={(event) => {
                event.preventDefault();

                const formData = new FormData(event.target);
                const price = formData.get("price");
                const amount = formData.get("amount");

                if (price && amount) {
                    placeOrder(price, amount);
                }
            }}
        >
            <div class="input-group mb-3">
                <div class="input-group-prepend">
                    <span class="input-group-text">price</span>
                </div>
                <input type="text" class="form-control" name="price"></input>
                <div class="input-group-append">
                    <span class="input-group-text">baseToken</span>
                </div>
            </div>
            <div class="input-group mb-3">
                <div class="input-group-prepend">
                    <span class="input-group-text">amount</span>
                </div>
                <input type="text" class="form-control" name="amount"></input>
                <div class="input-group-append">
                    <span class="input-group-text">tradeToken</span>
                </div>
            </div>
            <div className="row">
                <div className="col">
                    {/* TODO: show Approve A or B explicitly */}
                    {!isApproved && <button className="btn btn-primary" onClick={() => { approve(); }}>Approve</button>}
                    {isApproved && <button className="btn btn-primary" disabled>Approved</button>}
                </div>
                <div className="col">
                    <button type="submit" class="btn btn-primary">{action}</button>
                </div>
            </div>
        </form>
    </div>
  );
}
