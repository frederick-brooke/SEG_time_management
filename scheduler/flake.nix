{
  description = "Lunar";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs }:
    let
      system = "x86_64-linux";
      pkgs = nixpkgs.legacyPackages.${system};

      nodeEnv = pkgs.buildEnv {
        name = "node-runtime";
        paths = [
          pkgs.nodejs_25
          pkgs.typescript
        ];
      };

    in
    {
      packages.${system} = {};

      apps.${system} = {
        default = {
          type = "app";
          program = "${pkgs.writeShellScript "default" ''
            echo "📋 Available Nix Flake Apps:"
            echo ""
            nix flake show
          ''}";
          meta.description = "Display all available flake apps";
        };

        init = {
          type = "app";
          program = "${pkgs.writeShellScript "init" ''
            set -e
            echo "🚀 Initializing development environment..."

            export PATH=${nodeEnv}/bin:$PATH

            echo "🔍 Checking for Node.js installation..."
            if ! command -v node &> /dev/null; then
              echo "⚠️  Node.js not found in PATH, Error no Node.js installed. Please install"
            fi

            NODE_VERSION=$(node --version)
            NPM_VERSION=$(npm --version)
            echo "✅ Node.js found: $NODE_VERSION"
            echo "✅ Npm found: $NPM_VERSION"

            echo "🔍 Verifying .env configuration..."

            if [ ! -f .env ]; then
              echo "❌ Error: .env file not found!"
              echo "Please copy .env.example to .env and configure it with your values"
              exit 1
            fi

            # List of required environment variables
            REQUIRED_VARS=(
              "DATABASE_URL"
              "NEXTAUTH_SECRET"
              "NEXTAUTH_URL"
              "GOOGLE_CLIENT_ID"
              "GOOGLE_CLIENT_SECRET"
              "NEXT_PUBLIC_PUSHER_KEY"
              "NEXT_PUBLIC_PUSHER_CLUSTER"
              "PUSHER_APP_ID"
              "PUSHER_KEY"
              "PUSHER_SECRET"
              "PUSHER_CLUSTER"
              "OPENCAGE_API_KEY"
              "OPENROUTE_API_KEY"
              "MAILEROO_BASE_URL"
              "MAILEROO_API_KEY"
              "MAILEROO_FROM"
            )

            MISSING_VARS=()

            for var in "''${REQUIRED_VARS[@]}"; do
              # Source .env and check if variable is set and not empty
              if ! grep -q "^$var=" .env || grep "^$var=" .env | grep -q "^$var=$"; then
                MISSING_VARS+=("$var")
              fi
            done

            if [ ''${#MISSING_VARS[@]} -gt 0 ]; then
              echo "❌ Error: The following environment variables are missing or empty:"
              printf '   - %s\n' "''${MISSING_VARS[@]}"
              echo ""
              echo "Please set these variables in your .env file"
              exit 1
            fi

            echo "✅ All environment variables configured correctly"

            echo "📦 Installing dependencies..."
            npm install

            # echo "🌱 Seeding database..."
           

            echo "✅ Setup complete!"
          ''}";
          meta.description = "Initialize development environment with Node.js, dependencies, and database seed";
        };

        run = {
          type = "app";
          program = "${pkgs.writeShellScript "run" ''
            set -e
            echo "🚀 Building and starting the application..."

            export PATH=${nodeEnv}/bin:$PATH

            echo "🔨 Building the application..."
            npm run build

            echo "⚙️  Starting the server..."
            npm run start

            echo "✅ Application started! Go to http://localhost:3000"
          ''}";
          meta.description = "Build and start the application in production mode";
        };

        dev = {
          type = "app";
          program = "${pkgs.writeShellScript "run" ''
            set -e

            export PATH=${nodeEnv}/bin:$PATH

            echo "🔨 Starting Dev server..."
            npm run dev
          ''}";
          meta.description = "Start the dev server";
        };

        tests = {
          type = "app";
          program = "${pkgs.writeShellScript "test" ''
            set -e
            echo "🚀 Running tests with coverage..."

            export PATH=${nodeEnv}/bin:$PATH

            echo "🧪 Running jest tests..."
            npm test --coverage

            echo ""
            echo "✅ Tests completed!"
            echo "📊 Coverage report generated!"
            echo "📂 Report location: $(pwd)/coverage/lcov-report/index.html"
          ''}";
          meta.description = "Run tests with coverage report generation";
        };

        seed = {
          type = "app";
          program = "${pkgs.writeShellScript "seed" ''
            set -e

            export PATH=${nodeEnv}/bin:$PATH

            echo "🚀 Seeding connected database"

            npm run seed

            echo "✅ Database seed complete";
            echo "To view database tables, run (npx prisma studio)"
          ''}";

          meta.description = "Seed the database with mock data";
        };

        unseed = {
          type = "app";
          program = "${pkgs.writeShellScript "unseed" ''
            set -e

            export PATH=${nodeEnv}/bin:$PATH

            echo "🚀 Unseeding connected database"

            npm run unseed

            echo "✅ Database successfully unseeded";
            echo "To view database tables, run (npx prisma studio)"
          ''}";

          meta.description = "Unseed the database, delete all data";
        };

      };
    };
}
