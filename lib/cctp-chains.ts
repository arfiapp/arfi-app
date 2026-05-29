/**
 * CCTP V2 — Supported testnet chains and contract addresses
 *
 * Sources:
 *   https://developers.circle.com/cctp/evm-smart-contracts
 *   https://docs.arc.network/arc/references/contract-addresses
 */

export type CctpChain = {
  id: number;
  name: string;
  shortName: string;
  domain: number;          // CCTP domain ID
  usdcAddress: `0x${string}`;
  tokenMessenger: `0x${string}`;
  messageTransmitter: `0x${string}`;
  rpcUrl: string;
  explorerUrl: string;
  icon: string;            // emoji fallback
};

// All testnet chains that support CCTP V2 and are relevant for Arc
export const CCTP_CHAINS: CctpChain[] = [
  {
    id: 5042002,
    name: "Arc Testnet",
    shortName: "Arc",
    domain: 26,
    usdcAddress:        "0x3600000000000000000000000000000000000000",
    tokenMessenger:     "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    rpcUrl:      "https://rpc.testnet.arc.network",
    explorerUrl: "https://testnet.arcscan.app",
    icon: "🔵"
  },
  {
    id: 11155111,
    name: "Ethereum Sepolia",
    shortName: "Sepolia",
    domain: 0,
    usdcAddress:        "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238",
    tokenMessenger:     "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    rpcUrl:      "https://rpc.sepolia.org",
    explorerUrl: "https://sepolia.etherscan.io",
    icon: "⟠"
  },
  {
    id: 84532,
    name: "Base Sepolia",
    shortName: "Base",
    domain: 6,
    usdcAddress:        "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    tokenMessenger:     "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    rpcUrl:      "https://sepolia.base.org",
    explorerUrl: "https://sepolia.basescan.org",
    icon: "🔷"
  },
  {
    id: 421614,
    name: "Arbitrum Sepolia",
    shortName: "Arbitrum",
    domain: 3,
    usdcAddress:        "0x75faf114eafb1BDbe2F0316DF893fd58CE46AA4d",
    tokenMessenger:     "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    rpcUrl:      "https://sepolia-rollup.arbitrum.io/rpc",
    explorerUrl: "https://sepolia.arbiscan.io",
    icon: "🔵"
  },
  {
    id: 11155420,
    name: "OP Sepolia",
    shortName: "Optimism",
    domain: 2,
    usdcAddress:        "0x5fd84259d66Cd46123540766Be93DFE6D43130D7",
    tokenMessenger:     "0x8FE6B999Dc680CcFDD5Bf7EB0974218be2542DAA",
    messageTransmitter: "0xE737e5cEBEEBa77EFE34D4aa090756590b1CE275",
    rpcUrl:      "https://sepolia.optimism.io",
    explorerUrl: "https://sepolia-optimism.etherscan.io",
    icon: "🔴"
  },
];

export function getChainById(id: number): CctpChain | undefined {
  return CCTP_CHAINS.find(c => c.id === id);
}

export function getChainByDomain(domain: number): CctpChain | undefined {
  return CCTP_CHAINS.find(c => c.domain === domain);
}

// Iris attestation API (testnet)
export const IRIS_API = "https://iris-api-sandbox.circle.com";
