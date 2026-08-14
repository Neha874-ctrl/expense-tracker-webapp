import os
import uuid
from functools import wraps
from datetime import datetime
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash

# --- Application Initialization ---

app = Flask(__name__)

# Configurable origins from environment variable or standard localhost URLs
allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5000",
    "http://127.0.0.1:5000"
]
env_origins = os.environ.get('ALLOWED_ORIGINS')
if env_origins:
    allowed_origins.extend([origin.strip() for origin in env_origins.split(',') if origin.strip()])

CORS(app, supports_credentials=True, origins=allowed_origins)

# Add a stable secret key to keep session logins active across server restarts
app.secret_key = os.environ.get('SECRET_KEY', 'payground-stable-secret-key-3b8c9d')

@app.after_request
def add_security_headers(response):
    """Adds all necessary security and privacy HTTP headers to every response."""
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains; preload'
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    response.headers['Permissions-Policy'] = 'geolocation=(), camera=(), microphone=(), payment=()'
    response.headers['Cross-Origin-Opener-Policy'] = 'same-origin'

    # Content Security Policy (CSP)
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        "img-src 'self' https://placehold.co https://imagedelivery.net data:; "
        "font-src 'self' https://fonts.gstatic.com; "
        "object-src 'none'; frame-ancestors 'none'; "
        "upgrade-insecure-requests;"
    )
    response.headers['Content-Security-Policy'] = csp
    return response

# --- Database Configuration (SQLAlchemy + PostgreSQL) ---

db_url = os.environ.get('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/expense_tracker')
# Normalize connection string for SQLAlchemy with psycopg driver
if db_url and db_url.startswith("postgresql://"):
    db_url = db_url.replace("postgresql://", "postgresql+psycopg://", 1)

app.config['SQLALCHEMY_DATABASE_URI'] = db_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# --- SQLAlchemy Models ---

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.String, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    password_hash = db.Column(db.String, nullable=False)

class Category(db.Model):
    __tablename__ = 'categories'
    name = db.Column(db.String, primary_key=True, nullable=False)
    user_id = db.Column(db.String, primary_key=True, nullable=False)

class Budget(db.Model):
    __tablename__ = 'budget'
    category = db.Column(db.String, primary_key=True, nullable=False)
    user_id = db.Column(db.String, primary_key=True, nullable=False)
    limit_amount = db.Column(db.Float, nullable=False, default=0.0)

class Expense(db.Model):
    __tablename__ = 'expenses'
    id = db.Column(db.String, primary_key=True)
    user_id = db.Column(db.String, nullable=False)
    category = db.Column(db.String, nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.String, nullable=False)
    description = db.Column(db.String, nullable=True)

# --- Data Helpers ---

def initialize_db():
    """Initializes tables in PostgreSQL database."""
    with app.app_context():
        db.create_all()

def create_default_categories_for_user(user_id):
    """Sets up standard category chips and limits for new signups."""
    default_categories = ["Food", "Travel", "Entertainment"]
    for cat in default_categories:
        existing_cat = Category.query.filter_by(name=cat, user_id=user_id).first()
        if not existing_cat:
            db.session.add(Category(name=cat, user_id=user_id))
        
        existing_budget = Budget.query.filter_by(category=cat, user_id=user_id).first()
        if not existing_budget:
            db.session.add(Budget(category=cat, user_id=user_id, limit_amount=0.0))
            
    db.session.commit()

def load_app_data(user_id):
    """Loads all application state from PostgreSQL for a specific user."""
    category_objs = Category.query.filter_by(user_id=user_id).order_by(Category.name.asc()).all()
    categories = [c.name for c in category_objs]

    budget_objs = Budget.query.filter_by(user_id=user_id).all()
    budget = {b.category: b.limit_amount for b in budget_objs}

    expense_objs = Expense.query.filter_by(user_id=user_id).order_by(Expense.date.desc()).all()
    expenses = [
        {
            "id": e.id,
            "category": e.category,
            "amount": e.amount,
            "date": e.date,
            "description": e.description or ""
        }
        for e in expense_objs
    ]

    return {
        "budget": budget,
        "expenses": expenses,
        "categories": categories
    }

# Initialize Database Schema
try:
    initialize_db()
except Exception as e:
    print(f"CRITICAL: Database initialization failed: {e}")

# --- Authentication Helpers ---

def login_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user_id' not in session:
            return jsonify({"message": "Unauthorized. Please log in."}), 401
        return f(*args, **kwargs)
    return decorated_function

# --- Authentication Endpoints ---

@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    """Checks and returns the current authenticated session user."""
    if 'user_id' in session and 'username' in session:
        return jsonify({
            "authenticated": True,
            "username": session['username'],
            "user_id": session['user_id']
        }), 200
    return jsonify({"authenticated": False}), 401

@app.route('/api/auth/logout', methods=['POST', 'GET'])
@app.route('/logout', methods=['POST', 'GET'])
def logout():
    """Clears user session and logs out."""
    session.clear()
    return jsonify({"message": "Logout successful!"}), 200

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Registers a new user and populates defaults."""
    try:
        data = request.get_json() or {}
        username = str(data.get('username', '')).strip().lower()
        password = str(data.get('password', ''))

        if not username or not password:
            return jsonify({"message": "Username and password cannot be empty."}), 400
        
        if len(password) < 6:
            return jsonify({"message": "Password must be at least 6 characters long."}), 400

        # Check if user already exists
        existing_user = User.query.filter_by(username=username).first()
        if existing_user:
            return jsonify({"message": "Username is already taken."}), 409

        # Register user
        user_id = str(uuid.uuid4())
        password_hash = generate_password_hash(password)
        
        new_user = User(id=user_id, username=username, password_hash=password_hash)
        db.session.add(new_user)
        db.session.commit()

        # Populate defaults
        create_default_categories_for_user(user_id)

        # Log user in
        session['user_id'] = user_id
        session['username'] = username

        return jsonify({"message": "Registration successful!", "username": username}), 201

    except Exception as e:
        db.session.rollback()
        print(f"Register Error: {e}")
        return jsonify({"message": f"Registration failed: {str(e)}"}), 500

@app.route('/api/auth/login', methods=['POST'])
def login():
    """Logs in an existing user."""
    try:
        data = request.get_json() or {}
        username = str(data.get('username', '')).strip().lower()
        password = str(data.get('password', ''))

        if not username or not password:
            return jsonify({"message": "Username and password cannot be empty."}), 400

        # Retrieve user
        user = User.query.filter_by(username=username).first()
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({"message": "Invalid username or password."}), 401

        # Log user in
        session['user_id'] = user.id
        session['username'] = user.username

        return jsonify({"message": "Login successful!", "username": user.username}), 200

    except Exception as e:
        print(f"Login Error: {e}")
        return jsonify({"message": f"Login failed: {str(e)}"}), 500

# --- Dashboard API Endpoints ---

@app.route('/')
def index():
    """API health status endpoint."""
    return jsonify({"status": "ok", "service": "Payground Expense Tracker API", "version": "1.0.0"})

@app.route('/api/state', methods=['GET'])
@login_required
def get_state():
    """Returns the current user application state."""
    user_id = session['user_id']
    try:
        user_data = load_app_data(user_id)
        return jsonify(user_data)
    except Exception as e:
        return jsonify({"message": f"Error loading state: {str(e)}"}), 500

@app.route('/api/categories', methods=['POST'])
@login_required
def handle_categories():
    """Adds or removes a category, persisting changes to PostgreSQL."""
    user_id = session['user_id']
    try:
        req_data = request.get_json() or {}
        action = req_data.get('action')
        raw_cat = req_data.get('category')
        
        if not raw_cat or not isinstance(raw_cat, str):
            return jsonify({"message": "Category name cannot be empty."}), 400

        category_name = raw_cat.strip().title()
        if not category_name:
            return jsonify({"message": "Category name cannot be empty."}), 400
        
        user_data = load_app_data(user_id)
        
        if action == 'add':
            if category_name in user_data['categories']:
                return jsonify({"message": f"Category '{category_name}' already exists."}), 409
            
            db.session.add(Category(name=category_name, user_id=user_id))
            db.session.add(Budget(category=category_name, user_id=user_id, limit_amount=0.0))
            db.session.commit()
            
            user_data = load_app_data(user_id)
            return jsonify({"message": f"Category '{category_name}' added.", "data": user_data})
        
        elif action == 'remove':
            if category_name not in user_data['categories']:
                return jsonify({"message": f"Category '{category_name}' not found."}), 404
            
            Category.query.filter_by(name=category_name, user_id=user_id).delete()
            Budget.query.filter_by(category=category_name, user_id=user_id).delete()
            Expense.query.filter_by(category=category_name, user_id=user_id).delete()
            db.session.commit()

            user_data = load_app_data(user_id)
            return jsonify({"message": f"Category '{category_name}' removed.", "data": user_data})

        return jsonify({"message": "Invalid category action."}), 400

    except Exception as e:
        db.session.rollback()
        print(f"Category Error: {e}")
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500

@app.route('/api/budget', methods=['POST'])
@login_required
def set_budget():
    """Sets the monthly budget for categories, persisting changes to PostgreSQL."""
    user_id = session['user_id']
    try:
        new_budget = request.get_json()
        if not isinstance(new_budget, dict):
            return jsonify({"message": "Invalid budget data format."}), 400

        user_data = load_app_data(user_id)
        validated_budget = {}
        
        for cat in user_data['categories']:
            amount = new_budget.get(cat)
            if amount is not None:
                try:
                    amount = float(amount)
                    validated_budget[cat] = amount
                except (ValueError, TypeError):
                    return jsonify({"message": f"Invalid amount provided for category '{cat}'."}), 400
            else:
                validated_budget[cat] = user_data['budget'].get(cat, 0.0)

        for cat, amount in validated_budget.items():
            existing_b = Budget.query.filter_by(category=cat, user_id=user_id).first()
            if existing_b:
                existing_b.limit_amount = amount
            else:
                db.session.add(Budget(category=cat, user_id=user_id, limit_amount=amount))

        db.session.commit()

        user_data = load_app_data(user_id)
        return jsonify({"message": "Budget updated successfully!", "data": user_data})

    except Exception as e:
        db.session.rollback()
        print(f"Budget Error: {e}")
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500

@app.route('/api/expense', methods=['POST'])
@login_required
def add_expense():
    """Adds a new expense transaction, persisting to PostgreSQL."""
    user_id = session['user_id']
    try:
        req_data = request.get_json() or {}
        raw_cat = req_data.get('category')
        if not raw_cat or not isinstance(raw_cat, str):
            return jsonify({"message": "Please select a valid category."}), 400

        category = raw_cat.strip().title()
        amount_str = req_data.get('amount')
        description = str(req_data.get('description', '')).strip()
        expense_id = str(uuid.uuid4())
        
        user_data = load_app_data(user_id)
        if category not in user_data['categories']:
            return jsonify({"message": f"Category '{category}' is not a recognized budget category."}), 400
        
        try:
            amount = float(amount_str)
            if amount <= 0:
                raise ValueError
        except (ValueError, TypeError):
            return jsonify({"message": "Please enter a valid positive amount."}), 400

        date = datetime.now().strftime("%Y-%m-%d")
        
        new_expense = Expense(
            id=expense_id,
            user_id=user_id,
            category=category,
            amount=amount,
            date=date,
            description=description
        )
        db.session.add(new_expense)
        db.session.commit()

        user_data = load_app_data(user_id)
        added_expense = next(
            (item for item in user_data['expenses'] if item['id'] == expense_id),
            {"id": expense_id, "category": category, "amount": amount, "date": date, "description": description}
        )
        return jsonify({"message": "Expense added successfully!", "data": added_expense})

    except Exception as e:
        db.session.rollback()
        print(f"Expense Error: {e}")
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500

@app.route('/api/expense/<expense_id>', methods=['DELETE'])
@login_required
def delete_expense_api(expense_id):
    """Deletes an expense transaction by ID, persisting change to PostgreSQL."""
    user_id = session['user_id']
    try:
        expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()
        if not expense:
            return jsonify({"message": f"Expense with ID {expense_id} not found."}), 404

        db.session.delete(expense)
        db.session.commit()

        return jsonify({"message": "Expense successfully removed!"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"Delete Expense Error: {e}")
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500

@app.route('/api/report', methods=['GET'])
@login_required
def generate_report():
    """Calculates and returns the full expense report."""
    user_id = session['user_id']
    try:
        user_data = load_app_data(user_id)
    except Exception as e:
        return jsonify({"message": f"Error loading state: {str(e)}"}), 500

    current_budget = user_data.get('budget', {})
    current_expenses = user_data.get('expenses', [])
    categories = user_data.get('categories', [])

    # Calculate spent by category
    spent_by_category = {}
    total_spent = 0.0
    for entry in current_expenses:
        cat = entry.get("category")
        amt = entry.get("amount", 0.0)
        
        if cat in categories:
            spent_by_category[cat] = spent_by_category.get(cat, 0) + amt
            total_spent += amt

    # Compile report data
    report = []
    total_budget = 0.0
    for cat in categories:
        spent = spent_by_category.get(cat, 0.0)
        limit = current_budget.get(cat, 0.0)
        diff = spent - limit
        
        total_budget += limit

        report.append({
            "category": cat,
            "spent": spent,
            "budget": limit,
            "difference": diff,
            "status": "Within Budget" if diff <= 0 else "Over Budget"
        })
        
    return jsonify({
        "report": report, 
        "total_spent": total_spent, 
        "total_budget": total_budget,
        "expenses_log": current_expenses 
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)