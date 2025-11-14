from flask import Blueprint, render_template

bp = Blueprint("pages", __name__)

@bp.route("/")
def home():
    return render_template("dashboard.html")

@bp.route("/rec")
def rec_page():
    return render_template("recommendations.html")

@bp.route("/calendar")
def calendar_page():
    return render_template("calendar.html")

@bp.route("/ui-docs")
def ui_docs_page():
    return render_template("ui_docs.html")
