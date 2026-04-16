from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    senha = db.Column(db.String(200), nullable=False) # Lembre-se de usar hash (werkzeug.security)
    
    # 1 = Admin, 2 = Professor, 3 = Aluno
    tipo_conta = db.Column(db.Integer, nullable=False, default=3)
    
    # Chave estrangeira referenciando a própria tabela (Um professor tem vários alunos)
    professor_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=True)
    
    # Relacionamento para acessar os alunos de um professor facilmente: professor.meus_alunos
    meus_alunos = db.relationship('Usuario', backref=db.backref('professor_responsavel', remote_side=[id]))

class Treino(db.Model):
    __tablename__ = 'treinos'
    
    id = db.Column(db.Integer, primary_key=True)
    nome_treino = db.Column(db.String(50), nullable=False) # Ex: "PUSH", "PULL", "LEGS"
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Vincula o treino a um aluno específico
    aluno_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    aluno = db.relationship('Usuario', foreign_keys=[aluno_id], backref='treinos_recebidos')

class ExercicioTreino(db.Model):
    __tablename__ = 'exercicios_treino'
    
    id = db.Column(db.Integer, primary_key=True)
    treino_id = db.Column(db.Integer, db.ForeignKey('treinos.id'), nullable=False)
    
    nome_exercicio = db.Column(db.String(100), nullable=False) # Ex: SUPINO RETO
    series = db.Column(db.Integer, nullable=False)
    reps = db.Column(db.Integer, nullable=False)
    carga_recomendada = db.Column(db.Float, nullable=False)
    
    treino = db.relationship('Treino', backref=db.backref('exercicios', lazy=True, cascade="all, delete-orphan"))