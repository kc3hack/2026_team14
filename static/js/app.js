document.addEventListener("DOMContentLoaded", () => {
    const map = L.map('map', {
        zoomControl: false
    }).setView([34.6937, 135.5023], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const routeCoordinates = [
        [34.6937, 135.5023],
        [34.6850, 135.5100],
        [34.6800, 135.5200]
    ];
    L.polyline(routeCoordinates, { color: 'blue', weight: 4 }).addTo(map);

    function createPoiMarker(id, lat, lng, title, datetime) {
        const poiIcon = L.divIcon({
            html: `
                <div class="poi-pin" id="pin-${id}">
                    <div class="poi-pin-inner">
                        <i class="fa-solid fa-star"></i>
                        <div class="poi-pin-text">
                            <strong>${title}</strong>
                            <span>${datetime}</span>
                        </div>
                    </div>
                </div>
            `,
            className: '',
            iconSize: [36, 50],
            iconAnchor: [18, 50]
        });

        const marker = L.marker([lat, lng], { icon: poiIcon }).addTo(map);

        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            const pinElement = document.getElementById(`pin-${id}`);
            if (pinElement) {
                pinElement.classList.toggle('expanded');
            }
        });

        configureLongPress(marker);
        return marker;
    }

    function createPhotoMarker(id, lat, lng, imageUrl, title, datetime) {
        const photoIcon = L.divIcon({
            html: `
                <div class="custom-photo-pin" id="pin-${id}">
                    <div class="custom-photo-pin-inner">
                        <div class="custom-photo-pin-img-wrapper">
                            <img src="${imageUrl}" alt="photo" />
                        </div>
                        <div class="custom-photo-pin-text">
                            <strong>${title}</strong>
                            <span>${datetime}</span>
                        </div>
                    </div>
                </div>
            `,
            className: '',
            iconSize: [70, 86],
            iconAnchor: [35, 86]
        });

        const marker = L.marker([lat, lng], { icon: photoIcon }).addTo(map);

        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            const pinElement = document.getElementById(`pin-${id}`);
            if (pinElement) {
                pinElement.classList.toggle('expanded');
            }
        });

        configureLongPress(marker);
        return marker;
    }

    const contextMenuMap = document.getElementById('context-menu-map');
    const contextMenuPin = document.getElementById('context-menu-pin');
    let currentLatLng = null;

    function hideAllContextMenus() {
        contextMenuMap.style.display = 'none';
        contextMenuPin.style.display = 'none';
    }

    function showContextMenuMap(e, latlng) {
        e.preventDefault();
        currentLatLng = latlng;
        const x = e.clientX || (e.touches && e.touches.length > 0 && e.touches[0].clientX) || e.pageX;
        const y = e.clientY || (e.touches && e.touches.length > 0 && e.touches[0].clientY) || e.pageY;

        hideAllContextMenus();
        contextMenuMap.style.display = 'block';
        contextMenuMap.style.left = `${x}px`;
        contextMenuMap.style.top = `${y}px`;
    }

    function showContextMenuPin(e, latlng) {
        e.preventDefault();
        currentLatLng = latlng;
        const x = e.clientX || (e.touches && e.touches.length > 0 && e.touches[0].clientX) || e.pageX;
        const y = e.clientY || (e.touches && e.touches.length > 0 && e.touches[0].clientY) || e.pageY;

        hideAllContextMenus();
        contextMenuPin.style.display = 'block';
        contextMenuPin.style.left = `${x}px`;
        contextMenuPin.style.top = `${y}px`;
    }

    map.on('contextmenu', (e) => {
        showContextMenuMap(e.originalEvent, e.latlng);
    });

    function configureLongPress(marker) {
        let longPressTimer;
        marker.on('mousedown touchstart', (e) => {
            longPressTimer = setTimeout(() => {
                showContextMenuPin(e.originalEvent, marker.getLatLng());
            }, 600);
        });
        marker.on('mouseup mouseleave touchend', () => {
            clearTimeout(longPressTimer);
        });
        marker.on('contextmenu', (e) => {
            L.DomEvent.preventDefault(e);
            showContextMenuPin(e.originalEvent, marker.getLatLng());
        });
    }

    // Initialize mock data
    createPoiMarker("poi1", 34.7024, 135.4959, "梅田スカイビル", "2026/02/21 16:00");
    createPhotoMarker("photo1", 34.6800, 135.5200, "https://picsum.photos/300/200", "美しい景色", "14:00 訪問");

    map.on('click', () => {
        hideAllContextMenus();

        document.querySelectorAll('.custom-photo-pin.expanded, .poi-pin.expanded').forEach(pin => {
            pin.classList.remove('expanded');
        });

        if (isSheetOpen) {
            isSheetOpen = false;
            bottomSheet.classList.remove("open");
        }
    });

    const modalAddLocation = document.getElementById('add-location-modal');
    const inputDatetime = document.getElementById('visit-datetime');

    function openAddModal(type) {
        hideAllContextMenus();

        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        inputDatetime.value = now.toISOString().slice(0, 16);

        const title = document.getElementById('modal-title');
        if (type === 'photo') {
            title.innerHTML = '<i class="fa-solid fa-camera"></i> 写真ありスポットを追加';
        } else {
            title.innerHTML = '<i class="fa-solid fa-location-dot"></i> 写真なしスポットを追加';
        }

        modalAddLocation.style.display = 'flex';
    }

    document.getElementById('menu-map-add-photo').addEventListener('click', () => openAddModal('photo'));
    document.getElementById('menu-map-add-poi').addEventListener('click', () => openAddModal('poi'));

    document.getElementById('menu-pin-edit').addEventListener('click', () => {
        alert("詳細・編集画面を開きます");
        hideAllContextMenus();
    });

    document.getElementById('menu-pin-delete').addEventListener('click', () => {
        if (confirm("このピンを削除しますか？")) {
            alert("削除しました。");
        }
        hideAllContextMenus();
    });

    document.getElementById('btn-cancel-add').addEventListener('click', () => {
        modalAddLocation.style.display = 'none';
    });

    document.getElementById('btn-confirm-add').addEventListener('click', () => {
        alert(`保存しました！\\n日時: ${inputDatetime.value}\\n緯度/経度: ${currentLatLng.lat.toFixed(4)}, ${currentLatLng.lng.toFixed(4)}`);
        modalAddLocation.style.display = 'none';
    });

    const btnRecord = document.getElementById("btn-record");
    btnRecord.addEventListener("click", () => {
        alert("現在の位置情報を記録しました。");
    });

    const btnCamera = document.getElementById("btn-camera");
    if (btnCamera) {
        btnCamera.addEventListener("click", () => {
            alert("カメラを起動して写真を撮影します。");
        });
    }

    const btnGallery = document.getElementById("btn-gallery");
    if (btnGallery) {
        btnGallery.addEventListener("click", () => {
            alert("ライブラリから写真を選択して追加します。");
        });
    }

    const btnCollection = document.getElementById("btn-collection");
    const bottomSheet = document.getElementById("bottom-sheet");
    const dragHandle = document.querySelector(".sheet-drag-handle");
    let isSheetOpen = false;

    function toggleSheet() {
        isSheetOpen = !isSheetOpen;
        if (isSheetOpen) {
            bottomSheet.classList.add("open");
        } else {
            bottomSheet.classList.remove("open");
        }
    }

    btnCollection.addEventListener("click", toggleSheet);
    dragHandle.addEventListener("click", toggleSheet);

    let startY = 0;
    let currentY = 0;
    let isDragging = false;
    const dragThreshold = 100;

    bottomSheet.addEventListener("touchstart", (e) => {
        if (!isSheetOpen) return;
        startY = e.touches[0].clientY;
        isDragging = true;
        bottomSheet.classList.add("dragging");
    }, { passive: true });

    bottomSheet.addEventListener("touchmove", (e) => {
        if (!isDragging) return;
        currentY = e.touches[0].clientY;
        let deltaY = currentY - startY;

        if (deltaY > 0) {
            bottomSheet.style.transform = `translateY(${deltaY}px)`;
        }
    }, { passive: true });

    bottomSheet.addEventListener("touchend", (e) => {
        if (!isDragging) return;
        isDragging = false;
        bottomSheet.classList.remove("dragging");

        let deltaY = currentY - startY;
        bottomSheet.style.transform = '';

        if (deltaY > dragThreshold) {
            isSheetOpen = false;
            bottomSheet.classList.remove("open");
        }
    });
});
