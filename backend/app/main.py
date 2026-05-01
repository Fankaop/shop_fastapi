from fastapi import FastAPI
from fastapi.responses import Response
from fastapi.middleware.cors import CORSMiddleware
from .config import settings
from .database import init_db
from .api import api_router

app = FastAPI(
    title=settings.app_name,
    debug=settings.debug,
    docs_url='/api/docs',
    redoc_url='/api/redoc'
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)

@app.on_event('startup')
def on_startup():
    init_db()

@app.get('/')
def root():
    return {
        'message': 'Welcome to fastapi shop API',
        "docs": "api/docs",
    }

@app.get('/health')
def health_check():
    return {'status': 'healthy'}


@app.get('/apple-touch-icon.png', include_in_schema=False)
def apple_touch_icon():
    return Response(status_code=204)


@app.get('/apple-touch-icon-precomposed.png', include_in_schema=False)
def apple_touch_icon_precomposed():
    return Response(status_code=204)