const qrInput = document.getElementById('qrInput');
const qrSize = document.getElementById('qrSize');
const generateBtn = document.getElementById('generateBtn');
const qrSection = document.getElementById('qrSection');
const qrImage = document.getElementById('qrImage');
const downloadBtn = document.getElementById('downloadBtn');
const themeToggleBtn = document.getElementById('themeToggleBtn');
const toggleIcon = document.querySelector('.toggle-icon');
const pngBtn = document.getElementById('pngBtn');
const svgBtn = document.getElementById('svgBtn');


let selectedFormat = 'png';


function toggleTheme() {
    const body = document.body;
    const isDarkMode = body.classList.contains('dark-mode');
    
    if (isDarkMode) {
        body.classList.remove('dark-mode');
        body.classList.add('light-mode');
        toggleIcon.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', 'light');
    } else {
        body.classList.remove('light-mode');
        body.classList.add('dark-mode');
        toggleIcon.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', 'dark');
    }
}

// Helper function to create and show tooltips
function showTooltip(element, message, duration = 2000) {
    const tooltip = document.createElement('div');
    tooltip.className = 'tooltip';
    tooltip.textContent = message;
    document.body.appendChild(tooltip);
    
    const rect = element.getBoundingClientRect();
    tooltip.style.top = `${rect.bottom + 10}px`;
    tooltip.style.left = `${rect.left + rect.width/2 - tooltip.offsetWidth/2}px`;
    
    setTimeout(() => {
        tooltip.classList.add('tooltip-fade');
        setTimeout(() => document.body.removeChild(tooltip), 300);
    }, duration);
    
    return tooltip;
}

// Check for saved theme preference
document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.remove('light-mode');
        document.body.classList.add('dark-mode');
        toggleIcon.innerHTML = '<i class="fas fa-sun"></i>';
    }
});

// Add theme toggle event listener
themeToggleBtn.addEventListener('click', toggleTheme);

// Format selection handlers
function setActiveFormat(format) {
    selectedFormat = format;
    
    // Update button states
    if (format === 'png') {
        pngBtn.classList.add('active');
        svgBtn.classList.remove('active');
    } else {
        svgBtn.classList.add('active');
        pngBtn.classList.remove('active');
    }
    
    // Update button text if QR is already generated
    if (qrImage.style.display === 'block') {
        downloadBtn.textContent = `Download QR ${format.toUpperCase()}`;
    }
}

// Add format button event listeners
pngBtn.addEventListener('click', () => setActiveFormat('png'));
svgBtn.addEventListener('click', () => setActiveFormat('svg'));

// Generate QR code when button is clicked
generateBtn.addEventListener('click', generateQRCode);

// Also generate when Enter key is pressed in the input
qrInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        generateQRCode();
    }
});

function generateQRCode() {
    const inputValue = qrInput.value.trim();
    
    if (inputValue === '') {
        // Create a subtle shake animation for the input field
        qrInput.classList.add('shake');
        setTimeout(() => {
            qrInput.classList.remove('shake');
        }, 600);
        
        // Focus on the input field
        qrInput.focus();
        
        // Show tooltip instead of alert
        showTooltip(qrInput, 'Please enter some text or URL');
        return;
    }
    
    // Get selected size
    const size = qrSize.value;
    
    // Hide placeholder
    const placeholder = document.querySelector('.qr-placeholder');
    if (placeholder) {
        placeholder.style.display = 'none';
    }
    
    // Create loading effect
    const loadingIndicator = document.createElement('div');
    loadingIndicator.className = 'loading-spinner';
    qrSection.appendChild(loadingIndicator);
    
    // Create QR code URL with format parameter
    const formatParam = selectedFormat === 'svg' ? 'svg' : 'png';
    const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=${size}&data=${encodeURIComponent(inputValue)}&format=${formatParam}`;
    
    // Display QR code with short delay to show loading effect
    setTimeout(() => {
        // Remove loading spinner
        qrSection.removeChild(loadingIndicator);
        
        // Display QR code
        qrImage.crossOrigin = "anonymous";  // Add crossOrigin attribute for canvas use
        qrImage.src = qrCodeURL;
        qrImage.style.display = 'block';
        downloadBtn.style.display = 'block';
        
        // Update download button text to be more specific
        downloadBtn.textContent = `Download QR ${selectedFormat.toUpperCase()}`;
        
        // Store the generated URL for downloading
        qrImage.setAttribute('data-format', selectedFormat);
    }, 600);
}

// Download QR code
downloadBtn.addEventListener('click', () => {
    const format = qrImage.getAttribute('data-format') || 'png';
    
    // Handle SVG download
    if (format === 'svg') {
        // Fetch the SVG content directly from the API
        fetch(qrImage.src)
            .then(response => response.text())
            .then(svgContent => {
                // Create a Blob from the SVG content
                const blob = new Blob([svgContent], { type: 'image/svg+xml' });
                const url = URL.createObjectURL(blob);
                
                // Create download link
                const link = document.createElement('a');
                link.href = url;
                link.download = 'qrcode.svg';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Clean up the object URL
                setTimeout(() => URL.revokeObjectURL(url), 100);
                
                showTooltip(downloadBtn, 'SVG Downloaded!');
            })
            .catch(error => {
                console.error('Error downloading SVG:', error);
                showTooltip(downloadBtn, 'Download failed. Try again.');
            });
        return;
    }
    
    // Handle PNG download (using canvas)
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    // When the image has loaded
    const downloadQR = () => {
        // Set canvas dimensions to match the image
        canvas.width = qrImage.naturalWidth;
        canvas.height = qrImage.naturalHeight;
        
        // Draw the image onto the canvas
        context.drawImage(qrImage, 0, 0);
        
        // Convert the canvas to a data URL
        try {
            // Try to get the canvas data
            const dataURL = canvas.toDataURL('image/png');
            
            // Create download link
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = 'qrcode.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            showTooltip(downloadBtn, 'PNG Downloaded!');
        } catch (error) {
            // Fallback for CORS issues
            console.error('Error downloading PNG:', error);
            showTooltip(downloadBtn, 'Download started...');
        }
    };
    
    // If the image is already loaded
    if (qrImage.complete) {
        downloadQR();
    } else {
        // Wait for the image to load first
        qrImage.onload = downloadQR;
    }
});
