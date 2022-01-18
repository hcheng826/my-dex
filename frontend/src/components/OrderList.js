import React from "react";

export function OrderList({ title, orders }) {
  return (
    <div className="container">
        <h2>{title}</h2>
        <table className="table">
            <thead>
            <tr>
                <th scope="col">Price</th>
                <th scope="col">Amount</th>
            </tr>
            </thead>
            <tbody>
                  { [...Array(orders.length).keys()].map((idx) => {
                    return (
                      <tr>
                        <th>{orders[idx].price}</th>
                        <th>{orders[idx].amount}</th>
                      </tr>
                    )
                  })}
            </tbody>
        </table>
    </div>
  );
}
