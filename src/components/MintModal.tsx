import { useEffect, useState } from "react";
import { formatNumber } from "../functions/formatNumber";
import { XMarkIcon } from "@heroicons/react/24/solid";
import ImageCarousel from "./ImageCarousel";
import { BlockfrostProvider, MeshTxBuilder } from "@meshsdk/core";
import { useWallet } from "@meshsdk/react";
import { BLOCKFROST_API_KEY, SIDEKICK_MINT_ADA_PAYMENTS } from "@/constants";

interface MintModalProps {
  isOpen: boolean;
  onClose: () => void;
  lpTokensNeededADAV1: number;
  lpTokensNeededADAV2: number;
  lpTokensNeededSOL: number;
  cardanoAddress: string;
  solanaAddress: string;
}

const blockchainProvider = new BlockfrostProvider("mainnetlBWPrTbaGzxaghUHKqQnlZ48FkUV07Pl");

const MintModal = ({
  isOpen,
  onClose,
  lpTokensNeededADAV1,
  lpTokensNeededADAV2,
  lpTokensNeededSOL,
  cardanoAddress,
  solanaAddress,
}: MintModalProps) => {
  const { wallet, connected } = useWallet();
  const [mintAmount, setMintAmount] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSolSelected, setIsSolSelected] = useState<boolean>(true);
  const [isAdaV1Selected, setIsAdaV1Selected] = useState<boolean>(true);
  const [mintStatus, setMintStatus] = useState<string>(""); // State to track mint status

  if (!isOpen) return null; // Don't render the modal if `isOpen` is false

  const getLpTokensNeeded = () =>
    isSolSelected
      ? lpTokensNeededSOL // SOL LP is selected
      : isAdaV1Selected
      ? lpTokensNeededADAV1 // ADA V1 LP is selected
      : lpTokensNeededADAV2; // ADA V2 LP is selected

  const lpTokensNeeded = getLpTokensNeeded();
  const totalCost = mintAmount !== null ? mintAmount * lpTokensNeeded : 0;

  const images = [
    "/media/sidekickSneakPeek/sidekick1.jpg",
    "/media/sidekickSneakPeek/sidekick2.jpg",
    "/media/sidekickSneakPeek/sidekick3.png",
    "/media/sidekickSneakPeek/sidekick4.jpg",
    "/media/sidekickSneakPeek/sidekick5.jpg",
  ];

  // Mint handler using Mesh SDK
  const handleMint = async () => {
    if (!wallet._walletName) {
      setError("Wallet not connected. Please connect your wallet.");
      console.error("Error: Wallet not connected. Cardano Address or Solana Address is missing.");
      return;
    }

    if (mintAmount !== null && mintAmount > 0 && lpTokensNeeded > 0) {
      setMintStatus("Building TX..."); // Show "Building TX" status

      try {
        let recipientAddress: string;
        let asset: string;

        if (isSolSelected) {
          recipientAddress = cardanoAddress;
          onClose();
          return;
        } else {
          recipientAddress = SIDEKICK_MINT_ADA_PAYMENTS;
          if (isAdaV1Selected) {
            asset = "e4214b7cce62ac6fbba385d164df48e157eae5863521b4b67ca71d86ccd6ccf11c5eab6a9964bc9a080a506342a4bb037209e100f0be238da7495a9c";
          } else {
            asset = "f5808c2c990d86da54bfc97d89cee6efa20cd8461616359478d96b4c98cd1a0de51bf17c8ae857f72f215c75a447e4d04fa35cb58364e85e476012c3";
          }
        }

        const amount = '100'//String((mintAmount*lpTokensNeeded).toFixed(0));

        // Create a new transaction builder instance
        const txBuilder = new MeshTxBuilder({
          fetcher: blockchainProvider,
          evaluator: blockchainProvider,
        });

        const utxos = await wallet.getUtxos();
        const changeAddress = await wallet.getChangeAddress();

        const userbalance = checkUserBalance(utxos, asset);

        if (userbalance < parseInt(amount)) {
          setError("Insufficient User Balance");
          setMintStatus("");
          return;
        }

        // Build the transaction
        const unsignedTx = await txBuilder
          .txOut(recipientAddress, [{ unit: asset, quantity: amount },{ unit: "lovelace", quantity: "4000000" }])
          .changeAddress(changeAddress)
          .selectUtxosFrom(utxos)
          .complete();

        setMintStatus("Awaiting TX signature..."); // Show "Awaiting TX signature" status

        const signedTx = await wallet.signTx(unsignedTx);
        setMintStatus("Awaiting confirmation..."); // Show "Awaiting confirmation" status

        const txHash = await wallet.submitTx(signedTx);

        blockchainProvider.onTxConfirmed(txHash, () => {
          alert(`Transaction successful! Hash: ${txHash}`);
          setMintStatus("");
          onClose(); // Close modal after minting
        });

      } catch (error) {
        setError("Minting failed. Please try again.");
        setMintStatus("");
      }
    } else {
      setError("Please enter a valid mint amount.");
    }
  };

  function checkUserBalance(fetchedUTXOs: any, asset: string) {
    let totalBalance = 0;
    const utxoList = typeof fetchedUTXOs === 'string' ? JSON.parse(fetchedUTXOs) : fetchedUTXOs;
    utxoList.forEach((utxo: { output: { amount: any[]; }; }) => {
      utxo.output.amount.forEach((amount) => {
        if (amount.unit === asset) {
          totalBalance += Number(amount.quantity);
        }
      });
    });
    return totalBalance;
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setMintAmount(value >= 1 ? value : null);
    setError(value < 1 ? "Mint amount cannot be negative." : null);
  };

  const incrementAmount = () => setMintAmount((prev) => (prev !== null ? prev + 1 : 1));
  const decrementAmount = () => setMintAmount((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));

  const toggleLPType = () => setIsSolSelected(!isSolSelected);
  const toggleAdaVersion = () => setIsAdaV1Selected(!isAdaV1Selected);

  return (
    <div
      className={
        (isOpen ? "block" : "hidden") +
        " w-screen h-screen flex items-center justify-center fixed top-0 left-0 z-50 bg-black bg-opacity-50 backdrop-blur-lg"
      }
    >
      {isOpen && (
        <section className="relative bg-gradient-to-b from-purple-500 via-blue-500 to-green-500 p-0.5 rounded-xl">
          <div className="flex flex-col items-center justify-center overflow-y-auto w-screen h-screen sm:min-w-[42vw] sm:max-w-[90vw] sm:min-h-[69vh] sm:max-h-[90vh] sm:w-fit sm:h-fit p-8 sm:rounded-xl bg-zinc-800">
            <button
              className="w-6 h-6 rounded-full absolute top-2 right-4 z-10"
              onClick={onClose}
            >
              <XMarkIcon className="w-8 h-8 animate-pulse hover:animate-spin" />
            </button>

            <ImageCarousel images={images} />

            <div className="mb-4 mt-2 flex items-center justify-center">
              <span className="mr-2 px-4 py-2 text-white">TRTL/ADA LP</span>
              <div
                onClick={toggleLPType}
                className="relative inline-block w-12 h-6 cursor-pointer bg-gray-500 rounded-full"
              >
                <span
                  className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform transform ${
                    isSolSelected ? "translate-x-6" : ""
                  }`}
                />
              </div>
              <span className="ml-2 px-4 py-2 text-white">TRTL/SOL LP</span>
            </div>

            {!isSolSelected && (
              <div className="mb-4 flex items-center justify-center">
                <span className="mr-2 px-4 text-white">V1 Pool</span>
                <div
                  onClick={toggleAdaVersion}
                  className="relative inline-block w-12 h-6 cursor-pointer bg-gray-500 rounded-full"
                >
                  <span
                    className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full transform ${
                      !isAdaV1Selected ? "translate-x-6" : ""
                    }`}
                  />
                </div>
                <span className="ml-2 px-4 text-white">V2 Pool</span>
              </div>
            )}

            <p className="text-white text-center">
              {formatNumber(parseInt(totalCost.toFixed(0)))}{" "}
              {isSolSelected ? "SOL" : "ADA"} LP Tokens required
            </p>

            <div className="flex items-center justify-center mt-4 mb-4">
              <button
                onClick={decrementAmount}
                className="bg-gray-300 hover:bg-red-500 text-black px-2 rounded-l-md text-md"
              >
                -
              </button>
              <input
                readOnly
                type="number"
                placeholder="0"
                value={mintAmount || ""}
                onChange={handleInputChange}
                className="border p-2 w-24 text-center text-white bg-neutral-800 rounded-md"
              />
              <button
                onClick={incrementAmount}
                className="bg-gray-300 hover:bg-green-500 text-black px-2 rounded-r-md"
              >
                +
              </button>
            </div>

            {error && <p className="text-red-500 text-center">{error}</p>}

            <div className="relative inline-flex items-center">
              <button
                onClick={handleMint}
                disabled={mintStatus !== ""}
                className="bg-gradient-to-b from-blue-500 via-indigo-600 to-purple-700 text-white px-6 py-2 rounded-lg hover:scale-105 disabled:opacity-50"
              >
                {mintStatus || "Mint"}
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default MintModal;
