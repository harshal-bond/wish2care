# Wish2Care SAFE Wellness Score Tool

A full-stack web application for collecting student wellness screening data, designed to replace manual Excel entry while preserving all calculations and report generation.

## Features

- **Field Worker Dashboard**: Minimal, touch-friendly interface for data entry.
- **Admin Dashboard**: Overview of completion stats and export functionality.
- **Excel Export**: Uses the exact `Wish2Care_SAFE_Wellness_Score_Tool.xlsx` as a template.
- **Dynamic Rows**: Automatically extends the Excel template if there are more than 60 students, preserving formulas, formatting, and dropdown validations.

## Prerequisites

- Node.js v18+
- PostgreSQL (Local or via Docker)

## Setup Instructions

### 1. Database Setup

If you have Docker installed, simply run:
```bash
docker-compose up -d
```
This will start a PostgreSQL database on `localhost:5432` and a pgAdmin interface on `localhost:5050`.

If you are using a local PostgreSQL installation:
1. Open pgAdmin or psql.
2. Create a new database named `wish2care`: `CREATE DATABASE wish2care;`
3. Update the `DATABASE_URL` in `.env` if your username/password differs from `postgres:postgres`.

### 2. Install Dependencies

In the root directory, run:
```bash
npm install
```

### 3. Setup Environment Variables

Copy the example env file:
```bash
cp .env.example .env
```
(Modify if your DB credentials differ)

### 4. Database Migration & Seeding

Run the following commands to generate tables and seed initial data:
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

This will create an Admin user (`admin@wish2care.org` / `admin123`) and a Field Worker (`worker@wish2care.org` / `worker123`).

### 5. Start Development Servers

Start both the backend and frontend concurrently:
```bash
npm run dev
```

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000

## Architecture

- **shared/**: Zod schemas, TypeScript types, and domain constants.
- **backend/**: Hono + Drizzle ORM + PostgreSQL. Handles Excel template population.
- **frontend/**: Vite + React + TailwindCSS.
