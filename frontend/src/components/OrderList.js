import React from "react";

export function OrderList({ action, orders }) {
  const color = action === 'Buy'? 'bg-success' : 'bg-danger';
  return (
    <div className="container">
        <h3>{action} Order</h3>
        <table className="table">
            <thead className="text-white bg-secondary">
            <tr>
                <th scope="col">Price</th>
                <th scope="col">Amount</th>
            </tr>
            </thead>
            <tbody className={"text-white " + color}>
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
