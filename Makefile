# ============================================================
# ARBFARM MAKEFILE — TESTNET DEPLOYMENT & DEVELOPMENT
# ============================================================

.PHONY: help install compile deploy verify dev clean test

# Default target
.DEFAULT_GOAL := help

# Colors for output
GREEN  := \033[0;32m
YELLOW := \033[0;33m
RED    := \033[0;31m
NC     := \033[0m # No Color

# Environment
ENV_FILE := .env.local
ENV_EXAMPLE := .env.example

# Network (default: baseSepolia)
NETWORK ?= baseSepolia

help: ## Show this help message
	@echo "$(GREEN)ARBFARM - AI-Gated DeFi Arbitrage$(NC)"
	@echo ""
	@echo "$(YELLOW)Available targets:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(YELLOW)Usage:$(NC)"
	@echo "  make install              # Install all dependencies"
	@echo "  make compile              # Compile smart contracts"
	@echo "  make deploy               # Deploy to baseSepolia (default)"
	@echo "  make deploy NETWORK=arbitrumSepolia  # Deploy to specific network"
	@echo "  make verify               # Verify contract on block explorer"
	@echo "  make dev                  # Start development server"
	@echo "  make clean                # Clean artifacts and cache"

install: ## Install all dependencies (frontend + hardhat)
	@echo "$(GREEN)📦 Installing dependencies...$(NC)"
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "$(YELLOW)⚠️  Creating .env.local from .env.example...$(NC)"; \
		cp $(ENV_EXAMPLE) $(ENV_FILE); \
		echo "$(RED)⚠️  Please edit .env.local with your configuration$(NC)"; \
	fi
	@echo "$(GREEN)Installing npm packages...$(NC)"
	pnpm install
	@echo "$(GREEN)✅ Installation complete!$(NC)"

compile: ## Compile Solidity contracts
	@echo "$(GREEN)🔨 Compiling contracts...$(NC)"
	npx hardhat compile
	@echo "$(GREEN)✅ Compilation complete!$(NC)"

deploy: compile ## Deploy Arbfarm contract to testnet
	@echo "$(GREEN)🚀 Deploying to $(NETWORK)...$(NC)"
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "$(RED)❌ .env.local not found. Run 'make install' first.$(NC)"; \
		exit 1; \
	fi
	npx hardhat run scripts/deploy.ts --network $(NETWORK)
	@echo "$(GREEN)✅ Deployment complete!$(NC)"
	@echo "$(YELLOW)📝 Contract address saved to .env.local$(NC)"

verify: ## Verify deployed contract on block explorer
	@echo "$(GREEN)🔍 Verifying contract...$(NC)"
	@if [ -z "$$NEXT_PUBLIC_CONTRACT_ADDRESS" ]; then \
		echo "$(RED)❌ NEXT_PUBLIC_CONTRACT_ADDRESS not set in .env.local$(NC)"; \
		exit 1; \
	fi
	@echo "$(YELLOW)Manual verification command:$(NC)"
	@echo "npx hardhat verify --network $(NETWORK) $$NEXT_PUBLIC_CONTRACT_ADDRESS <SWAP_ROUTER> <WETH> <USDC>"
	@echo ""
	@echo "$(YELLOW)See deployment output for exact addresses$(NC)"

dev: ## Start Next.js development server
	@echo "$(GREEN)🌐 Starting development server...$(NC)"
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "$(RED)❌ .env.local not found. Run 'make install' first.$(NC)"; \
		exit 1; \
	fi
	pnpm dev

build: ## Build Next.js for production
	@echo "$(GREEN)📦 Building production app...$(NC)"
	pnpm build

test: ## Run Hardhat tests
	@echo "$(GREEN)🧪 Running tests...$(NC)"
	npx hardhat test

clean: ## Clean cache and artifacts
	@echo "$(GREEN)🧹 Cleaning artifacts...$(NC)"
	rm -rf cache artifacts
	@echo "$(GREEN)✅ Clean complete!$(NC)"

# Quick setup for judges
quickstart: install compile deploy dev ## Complete setup: install, compile, deploy, and start dev server
	@echo "$(GREEN)✅ Arbfarm is ready!$(NC)"
	@echo "$(YELLOW)📖 Open http://localhost:3000$(NC)"

# Check environment configuration
check-env: ## Check environment configuration
	@echo "$(GREEN)🔍 Checking environment...$(NC)"
	@if [ ! -f "$(ENV_FILE)" ]; then \
		echo "$(RED)❌ .env.local not found$(NC)"; \
		exit 1; \
	fi
	@echo "$(GREEN)✅ .env.local exists$(NC)"
	@grep -q "PRIVATE_KEY" $(ENV_FILE) && echo "$(GREEN)✅ PRIVATE_KEY configured$(NC)" || echo "$(RED)❌ PRIVATE_KEY missing$(NC)"
	@grep -q "GEMINI_API_KEY" $(ENV_FILE) && echo "$(GREEN)✅ GEMINI_API_KEY configured$(NC)" || echo "$(RED)❌ GEMINI_API_KEY missing$(NC)"
