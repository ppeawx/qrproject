// QR Code Generator Scripts
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

let qrCodeInstance = null;

function updateSliderFill(value) {
    const slider = document.getElementById('size-slider');
    const min = parseFloat(slider.min);
    const max = parseFloat(slider.max);
    const fillPercent = ((value - min) / (max - min)) * 100;
    const fgColor = document.getElementById('fg-color').value;
    slider.style.setProperty('--fill-percent', `${fillPercent}%`);
    slider.style.setProperty('--slider-fill-color-start', fgColor);
    slider.style.setProperty('--slider-fill-color-end', fgColor);
}

function changeSize(delta) {
    const sizeInput = document.getElementById('size-value');
    let currentValue = parseInt(sizeInput.value);
    let newValue = currentValue + delta;
    
    const min = parseInt(sizeInput.min);
    const max = parseInt(sizeInput.max);

    if (newValue >= min && newValue <= max) {
        sizeInput.value = newValue;
        handleSizeChange(sizeInput);
        debounce(generatePreviewQR, 300)();
    }
}

function handleSizeChange(sourceElement) {
    const slider = document.getElementById('size-slider');
    const numberInput = document.getElementById('size-value');
    
    let value = parseInt(sourceElement.value);
    const min = parseInt(sourceElement.min);
    const max = parseInt(sourceElement.max);

    if (isNaN(value) || value < min) value = min;
    if (value > max) value = max;
    
    if (sourceElement.id === 'size-value') {
        slider.value = value;
    } else {
        numberInput.value = value;
    }
    
    updateSliderFill(value);
}

function generatePreviewQR() {
    const text = document.getElementById('text-input').value.trim();
    const fgColor = document.getElementById('fg-color').value;
    const bgColor = document.getElementById('bg-color').value;
    const previewSize = 250;
    const errorCorrection = document.querySelector('input[name="error-correction"]:checked').value;
    
    const preview = document.getElementById('qr-preview');
    const downloadOptions = document.getElementById('download-options');
    
    if (!text) {
        if (qrCodeInstance) {
            preview.innerHTML = '';
            qrCodeInstance = null;
            showPlaceholder();
        }
        downloadOptions.classList.remove('show');
        return;
    }
    
    preview.classList.add('has-qr');
    
    preview.innerHTML = '';
    
    qrCodeInstance = new QRCode(preview, {
        text: text,
        width: previewSize,
        height: previewSize,
        colorDark: fgColor,
        colorLight: bgColor,
        correctLevel: QRCode.CorrectLevel[errorCorrection],
    });
}

function showPlaceholder() {
    const preview = document.getElementById('qr-preview');
    preview.innerHTML = `
        <div class="placeholder">
            <div class="placeholder-icon">📱</div>
            <p>QR Code จะแสดงที่นี่</p>
            <p style="font-size: 0.9em; margin-top: 5px;">ใส่ข้อความและปรับแต่งเพื่อดูพรีวิว</p>
        </div>
    `;
    document.getElementById('download-options').classList.remove('show');
    document.getElementById('qr-preview').classList.remove('has-qr');
}

function generateAndShowDownload() {
    const text = document.getElementById('text-input').value.trim();
    if (!text) {
        // ใช้ SweetAlert2 เพื่อแสดงข้อความแจ้งเตือนที่สวยงาม
        Swal.fire({
            title: "โปรดใส่ข้อมูล",
            text: "กรุณากรอกข้อความหรือ URL เพื่อสร้าง QR Code",
            icon: "warning",
            confirmButtonColor: "#667eea",
            confirmButtonText: "ตกลง"
        });
        return;
    }
    
    // โค้ดส่วนที่เหลือจะทำงานเมื่อมีข้อความถูกป้อน
    generatePreviewQR();
    const downloadOptions = document.getElementById('download-options');
    downloadOptions.classList.add('show');
}

// แก้ไขฟังก์ชัน downloadQR
function downloadQR(format) {
    const text = document.getElementById('text-input').value.trim();
    if (!text) {
        alert('กรุณาใส่ข้อความหรือ URL ก่อน');
        return;
    }
    
    const fgColor = document.getElementById('fg-color').value;
    const bgColor = document.getElementById('bg-color').value;
    const size = parseInt(document.getElementById('size-value').value);
    const errorCorrection = document.querySelector('input[name="error-correction"]:checked').value;
    
    if (format === 'svg') {
        const svgString = generateSVG(text, size, fgColor, bgColor, errorCorrection);
        const blob = new Blob([svgString], { type: 'image/svg+xml' });
        const downloadLink = URL.createObjectURL(blob);
        const filename = `qr-code.svg`;
        
        const link = document.createElement('a');
        link.download = filename;
        link.href = downloadLink;
        link.click();
        
        URL.revokeObjectURL(downloadLink);
    } else {
        requestAnimationFrame(() => {
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'fixed';
            tempDiv.style.top = '-9999px';
            tempDiv.style.left = '-9999px';
            document.body.appendChild(tempDiv);
            
            const qr = new QRCode(tempDiv, {
                text: text,
                width: size,
                height: size,
                colorDark: fgColor,
                colorLight: 'rgba(0,0,0,0)', // กำหนดสีพื้นหลังเป็นโปร่งใสสำหรับ Canvas
                correctLevel: QRCode.CorrectLevel[errorCorrection],
            });
            
            setTimeout(() => {
                const canvas = tempDiv.querySelector('canvas');
                if (!canvas) {
                    document.body.removeChild(tempDiv);
                    return;
                }

                let downloadLink;
                let filename;

                if (format === 'png') {
                    downloadLink = canvas.toDataURL('image/png');
                    filename = `qr-code.png`;
                } else if (format === 'jpeg') {
                    const jpegCanvas = document.createElement('canvas');
                    jpegCanvas.width = canvas.width;
                    jpegCanvas.height = canvas.height;
                    const jpegCtx = jpegCanvas.getContext('2d');
                    jpegCtx.fillStyle = '#FFFFFF';
                    jpegCtx.fillRect(0, 0, jpegCanvas.width, jpegCanvas.height);
                    jpegCtx.drawImage(canvas, 0, 0);
                    downloadLink = jpegCanvas.toDataURL('image/jpeg', 0.9);
                    filename = `qr-code.jpeg`;
                }

                const link = document.createElement('a');
                link.download = filename;
                link.href = downloadLink;
                link.click();
                
                document.body.removeChild(tempDiv);
            }, 100);
        });
    }
}

// แก้ไขฟังก์ชัน generateSVG
function generateSVG(text, size, fgColor, bgColor, errorCorrection) {
    const tempDiv = document.createElement('div');
    tempDiv.style.visibility = 'hidden';
    document.body.appendChild(tempDiv);

    const qr = new QRCode(tempDiv, {
        text: text,
        correctLevel: QRCode.CorrectLevel[errorCorrection]
    });

    const canvas = tempDiv.querySelector('canvas');
    if (!canvas) {
        document.body.removeChild(tempDiv);
        return '';
    }

    const context = canvas.getContext('2d');
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const moduleSize = size / canvas.width;

    let svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">`;

    for (let y = 0; y < canvas.height; y++) {
        for (let x = 0; x < canvas.width; x++) {
            const index = (y * canvas.width + x) * 4;
            const r = imageData[index];
            const g = imageData[index + 1];
            const b = imageData[index + 2];
            
            if (r !== 255 || g !== 255 || b !== 255) {
                svgString += `<rect x="${x * moduleSize}" y="${y * moduleSize}" width="${moduleSize}" height="${moduleSize}" fill="${fgColor}" />`;
            }
        }
    }
    svgString += `</svg>`;
    document.body.removeChild(tempDiv);
    return svgString;
}

const sizeSlider = document.getElementById('size-slider');
const sizeValueInput = document.getElementById('size-value');

sizeSlider.addEventListener('input', () => {
    handleSizeChange(sizeSlider);
    debounce(generatePreviewQR, 300)();
    const downloadOptions = document.getElementById('download-options');
    downloadOptions.classList.remove('show');
});

sizeValueInput.addEventListener('input', () => {
    handleSizeChange(sizeValueInput);
    debounce(generatePreviewQR, 300)();
    const downloadOptions = document.getElementById('download-options');
    downloadOptions.classList.remove('show');
});

document.getElementById('text-input').addEventListener('input', () => {
    debounce(generatePreviewQR, 500)();
    const downloadOptions = document.getElementById('download-options');
    downloadOptions.classList.remove('show');
});

document.getElementById('fg-color').addEventListener('input', () => {
    generatePreviewQR();
    updateSliderFill(sizeSlider.value);
    const downloadOptions = document.getElementById('download-options');
    downloadOptions.classList.remove('show');
});

document.getElementById('bg-color').addEventListener('input', () => {
    generatePreviewQR();
    const downloadOptions = document.getElementById('download-options');
    downloadOptions.classList.remove('show');
});

document.querySelectorAll('input[name="error-correction"]').forEach(radio => {
    radio.addEventListener('change', () => {
        generatePreviewQR();
        const downloadOptions = document.getElementById('download-options');
        downloadOptions.classList.remove('show');
    });
});

window.addEventListener('load', function() {
    document.getElementById('text-input').value = '';
    handleSizeChange(document.getElementById('size-slider'));
    generatePreviewQR();
});

// Animated Background Scripts
document.addEventListener('mousemove', (e) => {
    const balls = document.querySelectorAll('.ball');
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    balls.forEach((ball, index) => {
        const speed = (index + 1) * 0.02;
        const x = (mouseX - window.innerWidth / 2) * speed;
        const y = (mouseY - window.innerHeight / 2) * speed;
        
        ball.style.transform += ` translate(${x}px, ${y}px)`;
    });
});

setInterval(() => {
    const balls = document.querySelectorAll('.ball');
    balls.forEach(ball => {
        ball.style.transform = '';
    });

}, 5000);
