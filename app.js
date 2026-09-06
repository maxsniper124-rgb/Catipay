/* ========================================
   BTW TOKEN PRESALE - PRODUCTION JAVASCRIPT
   TON CONNECT INTEGRATION
   ======================================== */

// ========================================
// CONFIGURATION
// ========================================

const CONFIG = {
    // Token Details
    TOKEN_NAME: 'BTW',
    TOKEN_SYMBOL: 'BTW',
    TOTAL_SUPPLY: 100_000_000,
    PRESALE_AMOUNT: 50_000_000,
    
    // Exchange Rate
    TON_PER_BTW: 50 / 6_000_000,
    BTW_PER_TON: 6_000_000 / 50,
    
    // Presale Details
    PRESALE_HARDCAP_TON: 833.33,
    PRESALE_ADDRESS: 'UQD0N_u4lRmmPiLLQdCZFduiiAub7Oh6ftWzIn7D88sumQ_9',
    
    // Countdown (30 days from now)
    PRESALE_END_DATE: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    
    // Counters Configuration (these start from 0 and increment)
    INITIAL_TOKENS_SOLD: 0,
    INITIAL_BUYERS: 0,
    TOKENS_PER_TRANSACTION: 6_000_000,
    
    // Blockchain
    BLOCKCHAIN: 'TON',
    NETWORK: 'mainnet',
};

// ========================================
// GLOBAL STATE
// ========================================

let STATE = {
    walletConnected: false,
    walletAddress: null,
    tonConnectUI: null,
    tokensSold: CONFIG.INITIAL_TOKENS_SOLD,
    buyers: CONFIG.INITIAL_BUYERS,
    fundingRaisedTON: 0,
};

// ========================================
// TON CONNECT INITIALIZATION
// ========================================

async function initTonConnect() {
    try {
        // Import TonConnectUI from CDN
        const { TonConnectUI } = window;
        
        if (!TonConnectUI) {
            console.error('TonConnectUI not loaded from CDN');
            return;
        }

        // Initialize TonConnectUI
        STATE.tonConnectUI = new TonConnectUI({
            manifestUrl: window.location.origin + '/tonconnect-manifest.json',
            buttonRootId: 'ton-connect-button',
        });

        // Listen for wallet connection status changes
        STATE.tonConnectUI.onStatusChange((walletInfo) => {
            if (walletInfo) {
                handleWalletConnected(walletInfo);
            } else {
                handleWalletDisconnected();
            }
        });

        console.log('TonConnectUI initialized successfully');
    } catch (error) {
        console.error('Error initializing TonConnectUI:', error);
        showError('Failed to initialize wallet connection. Please refresh the page.');
    }
}

// ========================================
// WALLET CONNECTION HANDLERS
// ========================================

function handleWalletConnected(walletInfo) {
    STATE.walletConnected = true;
    STATE.walletAddress = walletInfo.account.address;
    
    updateWalletUI();
    console.log('Wallet connected:', STATE.walletAddress);
}

function handleWalletDisconnected() {
    STATE.walletConnected = false;
    STATE.walletAddress = null;
    
    updateWalletUI();
    console.log('Wallet disconnected');
}

function updateWalletUI() {
    const connectBtn = document.getElementById('connectWalletBtn');
    const buyBtn = document.getElementById('buyButton');
    const walletStatus = document.getElementById('walletStatus');
    const buttonInfo = document.getElementById('buttonInfo');

    if (STATE.walletConnected) {
        // Shorten wallet address for display
        const shortAddress = `${STATE.walletAddress.substring(0, 6)}...${STATE.walletAddress.substring(-6)}`;
        
        connectBtn.textContent = `✓ ${shortAddress}`;
        connectBtn.disabled = true;
        connectBtn.style.opacity = '0.5';
        
        walletStatus.textContent = shortAddress;
        walletStatus.style.color = '#00d4ff';
        
        buyBtn.classList.remove('buy-button-disabled');
        buyBtn.disabled = false;
        buyBtn.innerHTML = '<span class="button-icon">⚡</span><span id="buyButtonText">Buy BTW</span>';
        buttonInfo.textContent = 'Ready to purchase BTW tokens';

    } else {
        connectBtn.textContent = '🔗 Connect Wallet';
        connectBtn.disabled = false;
        connectBtn.style.opacity = '1';
        
        walletStatus.textContent = 'Not Connected';
        walletStatus.style.color = 'var(--text-secondary)';
        
        buyBtn.classList.add('buy-button-disabled');
        buyBtn.disabled = true;
        buyBtn.innerHTML = '<span class="button-icon">⚡</span><span id="buyButtonText">Connect Wallet to Buy</span>';
        buttonInfo.textContent = 'Please connect your TON wallet';
    }
}

async function connectWallet() {
    try {
        if (!STATE.tonConnectUI) {
            showError('Wallet connection not initialized. Please refresh the page.');
            return;
        }

        // If already connected, show disconnect option
        if (STATE.walletConnected) {
            await STATE.tonConnectUI.disconnect();
            return;
        }

        // Open wallet selection modal
        await STATE.tonConnectUI.openModal();

    } catch (error) {
        console.error('Error connecting wallet:', error);
        showError('Failed to connect wallet. Please try again.');
    }
}

// ========================================
// BTW CALCULATION
// ========================================

function calculateBTW() {
    const tonInput = document.getElementById('tonInput');
    const btwOutput = document.getElementById('btwOutput');
    
    const tonAmount = parseFloat(tonInput.value) || 0;
    
    if (tonAmount < 0) {
        tonInput.value = '0';
        btwOutput.value = '0';
        return;
    }

    const btwAmount = tonAmount * CONFIG.BTW_PER_TON;
    btwOutput.value = formatNumber(btwAmount);
}

function formatNumber(num) {
    if (num >= 1_000_000) {
        return (num / 1_000_000).toFixed(2) + 'M';
    }
    if (num >= 1_000) {
        return (num / 1_000).toFixed(2) + 'K';
    }
    return num.toFixed(2);
}

// ========================================
// BUY TOKENS
// ========================================

async function buyTokens() {
    if (!STATE.walletConnected) {
        showError('Please connect your wallet first');
        return;
    }

    try {
        const tonInput = document.getElementById('tonInput');
        const tonAmount = parseFloat(tonInput.value) || 0;

        // Validation
        if (tonAmount <= 0) {
            showError('Please enter a valid amount');
            return;
        }

        if (tonAmount > 1000) {
            showError('Amount exceeds maximum allowed');
            return;
        }

        // Check if hardcap would be exceeded
        if (STATE.fundingRaisedTON + tonAmount > CONFIG.PRESALE_HARDCAP_TON) {
            showError(`Presale hardcap would be exceeded. Maximum available: ${(CONFIG.PRESALE_HARDCAP_TON - STATE.fundingRaisedTON).toFixed(2)} TON`);
            return;
        }

        showLoading('Processing your transaction...');
        
        // Create transaction
        const transaction = {
            validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
            messages: [
                {
                    address: CONFIG.PRESALE_ADDRESS,
                    amount: String(tonAmount * 1_000_000_000), // Convert to nanoTON
                    payload: createPayload(),
                },
            ],
        };

        // Send transaction using TonConnectUI
        const result = await STATE.tonConnectUI.sendTransaction(transaction);

        // Handle successful transaction
        const btwAmount = tonAmount * CONFIG.BTW_PER_TON;
        
        STATE.tokensSold += btwAmount;
        STATE.buyers += 1;
        STATE.fundingRaisedTON += tonAmount;

        updateCounters();
        updateProgress();

        hideLoading();
        showSuccess(
            `Successfully purchased ${formatNumber(btwAmount)} BTW tokens!`,
            result.boc
        );

        // Reset form
        tonInput.value = '';
        calculateBTW();

    } catch (error) {
        console.error('Transaction error:', error);
        hideLoading();
        
        // Check if user cancelled
        if (error.message.includes('cancelled') || error.message.includes('rejected')) {
            showError('Transaction cancelled by user');
        } else {
            showError(`Transaction failed: ${error.message}`);
        }
    }
}

function createPayload() {
    // Create a simple op:0 message payload
    // This is a basic payload for the presale smart contract
    return null; // Using state_init instead for proper TON transactions
}

// ========================================
// COUNTERS & PROGRESS
// ========================================

function updateCounters() {
    const tokensSoldElement = document.getElementById('tokensSold');
    const buyersCountElement = document.getElementById('buyersCount');
    const fundingGoalElement = document.getElementById('fundingGoal');

    animateCounter(tokensSoldElement, STATE.tokensSold);
    animateCounter(buyersCountElement, STATE.buyers);
    animateCounter(fundingGoalElement, STATE.fundingRaisedTON, true);
}

function animateCounter(element, value, isTON = false) {
    const target = isTON ? value.toFixed(2) : Math.floor(value);
    const current = parseFloat(element.textContent) || 0;
    const increment = (target - current) / 20;

    let frame = 0;
    const counter = setInterval(() => {
        frame++;
        const newValue = current + increment * frame;
        element.textContent = isTON 
            ? newValue.toFixed(2)
            : formatNumber(newValue);

        if (frame >= 20) {
            element.textContent = isTON 
                ? target.toFixed(2)
                : formatNumber(target);
            clearInterval(counter);
        }
    }, 30);
}

function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    const progressPercent = document.getElementById('progressPercent');
    const progressMax = document.getElementById('progressMax');

    const percent = Math.min((STATE.fundingRaisedTON / CONFIG.PRESALE_HARDCAP_TON) * 100, 100);
    
    progressFill.style.width = percent + '%';
    progressPercent.textContent = Math.floor(percent) + '%';
    progressMax.textContent = CONFIG.PRESALE_HARDCAP_TON.toFixed(2);
}

// ========================================
// COUNTDOWN TIMER
// ========================================

function startCountdown() {
    function updateCountdown() {
        const now = new Date().getTime();
        const endTime = CONFIG.PRESALE_END_DATE.getTime();
        const distance = endTime - now;

        if (distance <= 0) {
            // Countdown finished
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

// ========================================
// PARTICLES ANIMATION
// ========================================

function createParticles() {
    const container = document.getElementById('particles');
    const particleCount = Math.min(window.innerWidth / 50, 20);

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');

        const size = Math.random() * 3 + 1;
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        const duration = Math.random() * 20 + 10;
        const delay = Math.random() * 5;

        particle.style.width = size + 'px';
        particle.style.height = size + 'px';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.background = `rgba(0, 212, 255, ${Math.random() * 0.5 + 0.2})`;
        particle.style.boxShadow = `0 0 ${size * 2}px rgba(0, 212, 255, 0.5)`;
        particle.style.animation = `float ${duration}s linear ${delay}s infinite`;

        container.appendChild(particle);
    }

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes float {
            0% {
                transform: translateY(0px) translateX(0px);
                opacity: 0;
            }
            10% {
                opacity: 1;
            }
            90% {
                opacity: 1;
            }
            100% {
                transform: translateY(-${window.innerHeight}px) translateX(${Math.random() * 100 - 50}px);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
}

// ========================================
// MODAL MANAGEMENT
// ========================================

function showLoading(message = 'Processing...') {
    const modal = document.getElementById('loadingModal');
    const text = document.getElementById('loadingText');
    text.textContent = message;
    modal.classList.add('active');
}

function hideLoading() {
    const modal = document.getElementById('loadingModal');
    modal.classList.remove('active');
}

function showSuccess(message, txHash = null) {
    const modal = document.getElementById('successModal');
    const msgElement = document.getElementById('successMessage');
    const hashElement = document.getElementById('txHash');
    const btwElement = document.getElementById('btwReceived');

    msgElement.textContent = message;
    
    if (txHash) {
        hashElement.textContent = txHash.substring(0, 16) + '...';
    } else {
        hashElement.textContent = 'Pending confirmation';
    }

    const btwAmount = parseFloat(document.getElementById('btwOutput').value);
    btwElement.textContent = formatNumber(btwAmount) + ' BTW';

    modal.classList.add('active');
}

function showError(message) {
    const modal = document.getElementById('errorModal');
    const msgElement = document.getElementById('errorMessage');
    msgElement.textContent = message;
    modal.classList.add('active');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    modal.classList.remove('active');
}

// Close modals on background click
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('active');
    }
});

// ========================================
// FAQ ACCORDION
// ========================================

function toggleFAQ(button) {
    const item = button.parentElement;
    const isActive = item.classList.contains('active');

    // Close all other FAQs
    document.querySelectorAll('.faq-item').forEach(faq => {
        faq.classList.remove('active');
    });

    // Toggle current FAQ
    if (!isActive) {
        item.classList.add('active');
    }
}

// ========================================
// INITIALIZATION
// ======================================== 

document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing BTW Presale Website...');

    // Initialize TonConnect
    await initTonConnect();

    // Start countdown
    startCountdown();

    // Create particles
    createParticles();

    // Update initial counters
    updateCounters();
    updateProgress();

    // Set up input listeners
    document.getElementById('tonInput').addEventListener('input', calculateBTW);
    document.getElementById('tonInput').addEventListener('change', calculateBTW);

    // Set up button listeners
    document.getElementById('connectWalletBtn').addEventListener('click', connectWallet);
    document.getElementById('buyButton').addEventListener('click', buyTokens);

    // Update wallet UI
    updateWalletUI();

    console.log('BTW Presale Website initialized successfully');
});

// ========================================
// ERROR HANDLING
// ========================================

window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
});

// ========================================
// MOBILE RESPONSIVENESS
// ========================================

let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        // Recalculate on resize if needed
    }, 250);
});
