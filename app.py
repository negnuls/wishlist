import os
import secrets

from flask import Flask, render_template, jsonify, session
from dotenv import load_dotenv
from supabase import create_client


load_dotenv()

app = Flask(__name__)

app.secret_key = os.getenv("FLASK_SECRET_KEY")

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

supabase = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/api/products")
def get_products():

    response = (
        supabase
        .table("wishlist_items")
        .select("*")
        .order("id")
        .execute()
    )

    return jsonify(response.data)


@app.route("/api/products/<int:product_id>/reserve", methods=["POST"])
def reserve_product(product_id):

    if "reservation_token" not in session:
        session["reservation_token"] = secrets.token_urlsafe(32)

    token = session["reservation_token"]

    response = supabase.rpc(
        "reserve_wishlist_item",
        {
            "p_id": product_id,
            "p_token": token
        }
    ).execute()

    if response.data:
        return jsonify({
            "success": True
        })

    return jsonify({
        "success": False,
        "message": "Товар уже забронирован"
    }), 409


@app.route("/api/products/<int:product_id>/cancel", methods=["POST"])
def cancel_product(product_id):

    if "reservation_token" not in session:
        return jsonify({
            "success": False,
            "message": "Эта бронь принадлежит другому пользователю"
        }), 403

    token = session["reservation_token"]

    response = supabase.rpc(
        "cancel_wishlist_item",
        {
            "p_id": product_id,
            "p_token": token
        }
    ).execute()

    if response.data:
        return jsonify({
            "success": True
        })

    return jsonify({
        "success": False,
        "message": "Вы не можете отменить эту бронь"
    }), 403


if __name__ == "__main__":
    app.run(debug=True)