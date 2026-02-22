#!/bin/bash
echo "🎓 Setting up PNHS ACCESS Portal..."

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma client
echo "⚙️ Generating Prisma client..."
npx prisma generate

# Create database and push schema
echo "🗄️ Setting up database..."
npx prisma db push

# Seed with demo data
echo "🌱 Seeding demo data..."
node prisma/seed.js

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Start the dev server with: npm run dev"
echo "🌐 Open: http://localhost:3000"
echo ""
echo "Demo credentials:"
echo "  Admin:   admin / admin123"
echo "  Teacher: teacher1 / teacher123"
echo "  Student: student1 / student123"
