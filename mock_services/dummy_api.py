from flask import Flask, jsonify
import random

app = Flask(__name__)

@app.route('/api/external/orders', methods=['GET'])
def get_mock_orders():
    # Simulasi data dari Shopee/TikTok tanpa koordinat
    # Hanya menyertakan nama kota (City)
    mock_orders = [
        {
            "order_id": f"EXT-{random.randint(1000, 9999)}",
            "platform": "Shopee",
            "city": "Kota Bandung",
            "product": "Reload Oversized Tee",
            "amount": 159000
        },
        {
            "order_id": f"EXT-{random.randint(1000, 9999)}",
            "platform": "TikTok",
            "city": "Kabupaten Sleman",
            "product": "Denim Jacket",
            "amount": 459000
        },
        {
            "order_id": f"EXT-{random.randint(1000, 9999)}",
            "platform": "Shopee",
            "city": "Kabupaten Bogor",
            "product": "Graphic Hoodie",
            "amount": 349000
        },
        {
            "order_id": f"EXT-{random.randint(1000, 9999)}",
            "platform": "TikTok",
            "city": "Kota Medan",
            "product": "Vintage Shorts",
            "amount": 129000
        },
        {
            "order_id": f"EXT-{random.randint(1000, 9999)}",
            "platform": "Shopee",
            "city": "Kabupaten Gowa",
            "product": "Reload Crewneck",
            "amount": 249000
        },
        {
            "order_id": f"EXT-{random.randint(1000, 9999)}",
            "platform": "TikTok",
            "city": "Kota Jayapura",
            "product": "Reload Cap",
            "amount": 99000
        }
    ]

    
    return jsonify({
        "status": "success",
        "total": len(mock_orders),
        "data": mock_orders
    })

if __name__ == '__main__':
    # Berjalan di port 8000 untuk simulasi service eksternal
    print("Dummy Marketplace API Running on http://localhost:8000")
    app.run(port=8000)
