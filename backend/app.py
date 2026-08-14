import os
import uuid
import sqlite3
import requests
from functools import wraps
from datetime import datetime
from flask import Flask, request, jsonify, session
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash

# --- Configuration and Database Initialization ---

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

    # Content Security Policy (CSP) - Allow scripts, Google Fonts, and Google Symbols
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

# 1. Load Secure Environment Variables
DATABASE_URL = os.environ.get('DATABASE_URL') 
DATABASE_AUTH_TOKEN = os.environ.get('DATABASE_AUTH_TOKEN')

# 2. Turso HTTP API Setup
# Convert the libsql URL (e.g., libsql://...) to the HTTPS endpoint
API_URL = DATABASE_URL.replace("libsql://", "https://") if (DATABASE_URL and isinstance(DATABASE_URL, str)) else ""
http_session = requests.Session()
if DATABASE_AUTH_TOKEN:
    http_session.headers.update({
        "Authorization": f"Bearer {DATABASE_AUTH_TOKEN}",
        "Content-Type": "application/json"
    })

# Determine if we use local sqlite3 fallback
USE_LOCAL_DB = not API_URL

def execute_sql(sql_query, params=None):
    """Executes a single SQL query via the Turso HTTP API or local SQLite connection."""
    return execute_sql_batch([(sql_query, params or [])])[0]

def execute_sql_batch(statements_input):
    """Router for executing statements: calls Turso API if configured, otherwise local SQLite."""
    if USE_LOCAL_DB:
        return execute_sql_batch_local(statements_input)
    else:
        return execute_sql_batch_remote(statements_input)

def execute_sql_batch_local(statements_input):
    """Executes SQL statements locally in a transaction on a SQLite database file."""
    results = []
    db_path = os.path.join(os.path.dirname(__file__), "expense_tracker.db")
    
    conn = sqlite3.connect(db_path)
    try:
        cursor = conn.cursor()
        for item in statements_input:
            if isinstance(item, dict):
                q = item["q"]
                args = item.get("params", [])
            elif isinstance(item, (tuple, list)):
                q = item[0]
                args = item[1] if len(item) > 1 else []
            else:
                q = item
                args = []

            # Unpack argument types if they are from standard mapping
            raw_args = []
            for arg in args:
                if isinstance(arg, dict) and "value" in arg:
                    val = arg["value"]
                    if arg.get("type") == "integer":
                        raw_args.append(int(val))
                    elif arg.get("type") == "float":
                        raw_args.append(float(val))
                    elif arg.get("type") == "null":
                        raw_args.append(None)
                    else:
                        raw_args.append(val)
                else:
                    raw_args.append(arg)

            cursor.execute(q, raw_args)
            
            rows = cursor.fetchall()
            cols = [col[0] for col in cursor.description] if cursor.description else []
            rows_affected = cursor.rowcount
            
            results.append({
                "rows": [list(row) for row in rows],
                "rows_affected": rows_affected if rows_affected >= 0 else 0,
                "columns": cols
            })
            
        conn.commit()
        return results
    except Exception as e:
        conn.rollback()
        print(f"Local SQLite Execution Error: {e}")
        raise RuntimeError(f"SQL execution failed: {e}")
    finally:
        conn.close()

def execute_sql_batch_remote(statements_input):
    """Executes multiple SQL queries in a single HTTP request to the remote Turso API."""
    statements = []
    for item in statements_input:
        if isinstance(item, dict):
            statements.append(item)
        elif isinstance(item, (tuple, list)):
            q = item[0]
            args = item[1] if len(item) > 1 else []
            # Map Python types to simple JSON-serializable types in arguments
            mapped_args = []
            for arg in args:
                if isinstance(arg, bool):
                    mapped_args.append(1 if arg else 0)
                elif isinstance(arg, (int, float, str)) or arg is None:
                    mapped_args.append(arg)
                else:
                    mapped_args.append(str(arg))
            statements.append({"q": q, "params": mapped_args})
        else:
            statements.append({"q": item})

    try:
        response = http_session.post(f"{API_URL}", json={"statements": statements}, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        if not data or not isinstance(data, list):
            return [{"rows": [], "rows_affected": 0, "columns": []}] * len(statements_input)

        results = []
        for item in data:
            if 'error' in item:
                 raise RuntimeError(f"Turso SQL Error: {item['error']}")
            
            result = item.get('results', {})
            if 'error' in result:
                raise RuntimeError(f"Turso SQL Error: {result['error']}")

            # Parse result rows converting Turso format to simple list
            raw_rows = result.get('rows', [])
            parsed_rows = []
            for row in raw_rows:
                parsed_row = []
                for val in row:
                    if isinstance(val, dict) and "value" in val:
                        # Extract value from Turso cell representation
                        raw_val = val["value"]
                        if val.get("type") == "integer":
                            parsed_row.append(int(raw_val))
                        elif val.get("type") == "float":
                            parsed_row.append(float(raw_val))
                        elif val.get("type") == "null":
                            parsed_row.append(None)
                        else:
                            parsed_row.append(raw_val)
                    else:
                        parsed_row.append(val)
                parsed_rows.append(parsed_row)

            results.append({
                "rows": parsed_rows,
                "rows_affected": result.get('rows_affected', item.get('rows_affected', 0)),
                "columns": result.get('cols', [])
            })
            
        return results
        
    except requests.exceptions.RequestException as e:
        print(f"HTTP Request Error to Turso: {e}")
        raise RuntimeError(f"Connection or request failed: {e}")
    except Exception as e:
        print(f"Database Execution Error: {e}")
        raise RuntimeError(f"SQL execution failed: {e}")

def check_migration_needed():
    """Checks if the existing schema lacks user_id, meaning database needs schema cleanup."""
    try:
        res = execute_sql("PRAGMA table_info(expenses)")
        if not res or not res.get('rows'):
            return True # Table doesn't exist, need initialization
        columns = [row[1] for row in res['rows']]
        return "user_id" not in columns
    except Exception as e:
        print(f"Migration check failed or DB uninitialized: {e}")
        return True

def initialize_db():
    """Ensures necessary tables are created and handles user-related migration/cleanup."""
    try:
        if check_migration_needed():
            print("Database schema migration detected: Dropping old tables to clean database...")
            drop_statements = [
                "DROP TABLE IF EXISTS categories",
                "DROP TABLE IF EXISTS expenses",
                "DROP TABLE IF EXISTS budget",
                "DROP TABLE IF EXISTS users"
            ]
            for q in drop_statements:
                execute_sql(q)

        # Create new user-isolated tables
        statements = [
            "CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY NOT NULL, username TEXT UNIQUE NOT NULL, password_hash TEXT NOT NULL)",
            "CREATE TABLE IF NOT EXISTS categories (name TEXT NOT NULL, user_id TEXT NOT NULL, PRIMARY KEY (name, user_id))",
            "CREATE TABLE IF NOT EXISTS budget (category TEXT NOT NULL, user_id TEXT NOT NULL, limit_amount REAL NOT NULL, PRIMARY KEY (category, user_id))",
            "CREATE TABLE IF NOT EXISTS expenses (id TEXT PRIMARY KEY NOT NULL, user_id TEXT NOT NULL, category TEXT NOT NULL, amount REAL NOT NULL, date TEXT NOT NULL, description TEXT)"
        ]
        
        for q in statements:
            execute_sql(q)
            
    except Exception as e:
        print(f"Database Initialization Warning: {e}")

def create_default_categories_for_user(user_id):
    """Sets up standard category chips and limits for new signups."""
    default_categories = ["Food", "Travel", "Entertainment"]
    queries = []
    for cat in default_categories:
        queries.append((
            "INSERT INTO categories (name, user_id) VALUES (?, ?)",
            [cat, user_id]
        ))
        queries.append((
            "INSERT INTO budget (category, user_id, limit_amount) VALUES (?, ?, 0.0)",
            [cat, user_id]
        ))
    execute_sql_batch(queries)

def load_app_data(user_id):
    """Loads all application state from the database for a specific user."""
    queries = [
        ("SELECT name FROM categories WHERE user_id = ? ORDER BY name ASC", [user_id]),
        ("SELECT category, limit_amount FROM budget WHERE user_id = ?", [user_id]),
        ("SELECT id, category, amount, date, description FROM expenses WHERE user_id = ? ORDER BY date DESC", [user_id])
    ]
    
    results = execute_sql_batch(queries)
    
    categories = [row[0] for row in results[0]['rows']]
    budget = {row[0]: row[1] for row in results[1]['rows']}
    expenses = [
        {"id": row[0], "category": row[1], "amount": row[2], "date": row[3], "description": row[4]} 
        for row in results[2]['rows']
    ]
    
    return {
        "budget": budget,
        "expenses": expenses,
        "categories": categories
    }

# 3. Initialize DB on Application Start
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
        existing_user_res = execute_sql("SELECT id FROM users WHERE username = ?", [username])
        if existing_user_res['rows']:
            return jsonify({"message": "Username is already taken."}), 409

        # Register user
        user_id = str(uuid.uuid4())
        password_hash = generate_password_hash(password)
        
        execute_sql(
            "INSERT INTO users (id, username, password_hash) VALUES (?, ?, ?)",
            [user_id, username, password_hash]
        )
        
        # Populate defaults
        create_default_categories_for_user(user_id)

        # Log user in
        session['user_id'] = user_id
        session['username'] = username

        return jsonify({"message": "Registration successful!", "username": username}), 201

    except Exception as e:
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
        user_res = execute_sql("SELECT id, password_hash FROM users WHERE username = ?", [username])
        if not user_res['rows']:
            return jsonify({"message": "Invalid username or password."}), 401

        user_id, password_hash = user_res['rows'][0]

        if not check_password_hash(password_hash, password):
            return jsonify({"message": "Invalid username or password."}), 401

        # Log user in
        session['user_id'] = user_id
        session['username'] = username

        return jsonify({"message": "Login successful!", "username": username}), 200

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
    """Adds or removes a category, persisting changes to Turso/SQLite."""
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
            
            execute_sql_batch([
                ("INSERT INTO categories (name, user_id) VALUES (?, ?)", [category_name, user_id]),
                ("INSERT INTO budget (category, user_id, limit_amount) VALUES (?, ?, 0.0)", [category_name, user_id])
            ])
            
            user_data = load_app_data(user_id)
            return jsonify({"message": f"Category '{category_name}' added.", "data": user_data})
        
        elif action == 'remove':
            if category_name not in user_data['categories']:
                return jsonify({"message": f"Category '{category_name}' not found."}), 404
            
            execute_sql_batch([
                ("DELETE FROM categories WHERE name = ? AND user_id = ?", [category_name, user_id]),
                ("DELETE FROM budget WHERE category = ? AND user_id = ?", [category_name, user_id]),
                ("DELETE FROM expenses WHERE category = ? AND user_id = ?", [category_name, user_id])
            ])

            user_data = load_app_data(user_id)
            return jsonify({"message": f"Category '{category_name}' removed.", "data": user_data})

        return jsonify({"message": "Invalid category action."}), 400

    except Exception as e:
        print(f"Category Error: {e}")
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500

@app.route('/api/budget', methods=['POST'])
@login_required
def set_budget():
    """Sets the monthly budget for categories, persisting changes to Turso/SQLite."""
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

        # Update budgets in database using safe parameter binding
        queries = [
            ("INSERT OR REPLACE INTO budget (category, user_id, limit_amount) VALUES (?, ?, ?)", [cat, user_id, amount])
            for cat, amount in validated_budget.items()
        ]
        if queries:
            execute_sql_batch(queries)

        user_data = load_app_data(user_id)
        return jsonify({"message": "Budget updated successfully!", "data": user_data})

    except Exception as e:
        print(f"Budget Error: {e}")
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500

@app.route('/api/expense', methods=['POST'])
@login_required
def add_expense():
    """Adds a new expense transaction, persisting to Turso/SQLite."""
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
        
        execute_sql(
            "INSERT INTO expenses (id, user_id, category, amount, date, description) VALUES (?, ?, ?, ?, ?, ?)",
            [expense_id, user_id, category, amount, date, description]
        )

        user_data = load_app_data(user_id)
        added_expense = next(
            (item for item in user_data['expenses'] if item['id'] == expense_id),
            {"id": expense_id, "category": category, "amount": amount, "date": date, "description": description}
        )
        return jsonify({"message": "Expense added successfully!", "data": added_expense})

    except Exception as e:
        print(f"Expense Error: {e}")
        return jsonify({"message": f"An error occurred: {str(e)}"}), 500

@app.route('/api/expense/<expense_id>', methods=['DELETE'])
@login_required
def delete_expense_api(expense_id):
    """Deletes an expense transaction by ID, persisting change to Turso/SQLite."""
    user_id = session['user_id']
    try:
        result = execute_sql("DELETE FROM expenses WHERE id = ? AND user_id = ?", [expense_id, user_id])

        if result.get('rows_affected', 0) == 0:
            return jsonify({"message": f"Expense with ID {expense_id} not found."}), 404

        return jsonify({"message": "Expense successfully removed!"}), 200
    except Exception as e:
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

    # Compile the report data
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