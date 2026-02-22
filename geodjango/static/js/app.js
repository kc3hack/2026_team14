document.addEventListener("DOMContentLoaded", () => {
    // CSRF Token Function
    function getCookie(name) {
        const m = document.cookie.match(new RegExp("(^|;\\s*)" + name + "=([^;]*)"));
        return m ? decodeURIComponent(m[2]) : null;
    }
    const csrftoken = getCookie("csrftoken");

    const map = L.map('map', {
        zoomControl: false
    }).setView([35.681236, 139.767125], 13); // Default location, overridden by GPS

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    const markers = {}; // Store markers to allow deletion

    // API: Add Pin
    async function add_Pin(ido, keido, name) {
        try {
            const res = await fetch("api/pins", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(csrftoken ? { "X-CSRFToken": csrftoken } : {})
                },
                body: JSON.stringify({ ido, keido, name })
            });
            if (!res.ok) return null;
            const data = await res.json();
            return data.id;
        } catch (err) {
            console.error(err);
            return null;
        }
    }

    // API: Upload Photo
    async function uploadPhoto(pinId, file) {
        const fd = new FormData();
        fd.append("image", file);
        try {
            const res = await fetch(`api/pins/${pinId}/image/`, {
                method: "POST",
                body: fd,
                headers: { ...(csrftoken ? { "X-CSRFToken": csrftoken } : {}) }
            });
            return res.ok;
        } catch (err) {
            console.error(err);
            return false;
        }
    }

    // API: Load Pins
    async function loadPins() {
        try {
            const res = await fetch("api/pins");
            if (!res.ok) return;
            const data = await res.json();
            
            for (const p of data.pins) {
                const imgRes = await fetch(`api/pins/${p.id}/images/`);
                const imgData = await imgRes.json().catch(() => null);
                
                const title = p.name || "名称未設定";
                const dt = "保存済みスポット";

                if (imgData && imgData.images && imgData.images.length > 0) {
                    createPhotoMarker(p.id, p.ido, p.keido, imgData.images[0].url, title, dt);
                } else {
                    createPoiMarker(p.id, p.ido, p.keido, title, dt);
                }
            }
        } catch (err) {
            console.error("ピンのロードに失敗:", err);
        }
    }
    
    // Initial Load
    loadPins();

    // UI Marker Creators
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
        markers[id] = marker;

        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            const pinElement = document.getElementById(`pin-${id}`);
            if (pinElement) pinElement.classList.toggle('expanded');
        });

        configureLongPress(marker, id);
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
        markers[id] = marker;

        marker.on('click', (e) => {
            L.DomEvent.stopPropagation(e);
            const pinElement = document.getElementById(`pin-${id}`);
            if (pinElement) pinElement.classList.toggle('expanded');
        });

        configureLongPress(marker, id);
        return marker;
    }

    // Context Menus
    const contextMenuMap = document.getElementById('context-menu-map');
    const contextMenuPin = document.getElementById('context-menu-pin');
    let currentLatLng = null;
    let selectedPinId = null;

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

    function configureLongPress(marker, id) {
        let longPressTimer;
        marker.on('mousedown touchstart', (e) => {
            longPressTimer = setTimeout(() => {
                selectedPinId = id;
                showContextMenuPin(e.originalEvent, marker.getLatLng());
            }, 600);
        });
        marker.on('mouseup mouseleave touchend', () => {
            clearTimeout(longPressTimer);
        });
        marker.on('contextmenu', (e) => {
            L.DomEvent.preventDefault(e);
            selectedPinId = id;
            showContextMenuPin(e.originalEvent, marker.getLatLng());
        });
    }

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

    // Add Location Modal
    const modalAddLocation = document.getElementById('add-location-modal');
    const inputSpotName = document.getElementById('spot-name');
    const inputDatetime = document.getElementById('visit-datetime');
    let addLocationType = 'poi';

    function openAddModal(type) {
        hideAllContextMenus();
        addLocationType = type;

        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
        inputDatetime.value = now.toISOString().slice(0, 16);
        inputSpotName.value = "";

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
        alert("詳細・編集画面を開きます（実装予定）");
        hideAllContextMenus();
    });

    document.getElementById('menu-pin-delete').addEventListener('click', () => {
        if (selectedPinId && confirm("このピンを削除しますか？")) {
            // Front-end removal placeholder (Add API DELETE here if supported)
            if (markers[selectedPinId]) {
                map.removeLayer(markers[selectedPinId]);
                delete markers[selectedPinId];
            }
        }
        hideAllContextMenus();
    });

    document.getElementById('btn-cancel-add').addEventListener('click', () => {
        modalAddLocation.style.display = 'none';
    });

    document.getElementById('btn-confirm-add').addEventListener('click', async () => {
        const spotName = inputSpotName.value || "名称未設定";
        const datetime = inputDatetime.value.replace('T', ' ');
        modalAddLocation.style.display = 'none';

        const pinId = await add_Pin(currentLatLng.lat, currentLatLng.lng, spotName);
        if (!pinId) {
            alert("ピンの保存に失敗しました。");
            return;
        }

        if (addLocationType === 'photo') {
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.onchange = async (e) => {
                const file = e.target.files[0];
                if (file) {
                    await uploadPhoto(pinId, file);
                    createPhotoMarker(pinId, currentLatLng.lat, currentLatLng.lng, URL.createObjectURL(file), spotName, datetime);
                }
            };
            fileInput.click();
        } else {
            createPoiMarker(pinId, currentLatLng.lat, currentLatLng.lng, spotName, datetime);
        }
    });

    // GPS tracking (from map.html)
    let meMarker = null;
    let accCircle = null;
    let firstFix = true;
    let lastFix = null;

    function updateMe(ido, keido, accuracyMeters) {
        const ll = [ido, keido];
        lastFix = { ido, keido, acc: accuracyMeters };

        if (!meMarker) {
            meMarker = L.circleMarker(ll, { 
                radius: 8, color: '#fff', weight: 2, fillColor: '#4A90E2', fillOpacity: 1 
            }).addTo(map);
        } else {
            meMarker.setLatLng(ll);
        }

        const r = Math.max(accuracyMeters || 0, 5);
        if (!accCircle) {
            accCircle = L.circle(ll, { 
                radius: r, color: '#4A90E2', weight: 1, fillOpacity: 0.2 
            }).addTo(map);
        } else {
            accCircle.setLatLng(ll);
            accCircle.setRadius(r);
        }

        if (firstFix) {
            map.setView(ll, 16);
            firstFix = false;
        }
    }

    navigator.geolocation.watchPosition(
        pos => updateMe(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy),
        err => console.log("GPS error:", err.code, err.message),
        { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    );

    // Floating Action Buttons Logic
    const btnRecord = document.getElementById("btn-record");
    btnRecord.addEventListener("click", async () => {
        if (!lastFix) return alert("現在地を取得中です。");
        const name = prompt("スポット名を入力（空でも可）") || "現在地";
        const pinId = await add_Pin(lastFix.ido, lastFix.keido, name);
        if (pinId) {
            const now = new Date();
            const datetime = now.toISOString().slice(0, 16).replace('T', ' ');
            createPoiMarker(pinId, lastFix.ido, lastFix.keido, name, datetime);
        }
    });

    function selectAndUploadPhoto(useCamera) {
        if (!lastFix) return alert("現在地を取得中です。少し待ってから再度お試しください。");
        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.accept = 'image/*';
        if (useCamera) fileInput.capture = 'environment';
        
        fileInput.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                const name = prompt("スポット名を入力（空でも可）") || (useCamera ? "写真撮影スポット" : "ギャラリースポット");
                const pinId = await add_Pin(lastFix.ido, lastFix.keido, name);
                if (pinId) {
                    await uploadPhoto(pinId, file);
                    const now = new Date();
                    const datetime = now.toISOString().slice(0, 16).replace('T', ' ');
                    createPhotoMarker(pinId, lastFix.ido, lastFix.keido, URL.createObjectURL(file), name, datetime);
                }
            }
        };
        fileInput.click();
    }

    const btnCamera = document.getElementById("btn-camera");
    if (btnCamera) btnCamera.addEventListener("click", () => selectAndUploadPhoto(true));

    const btnGallery = document.getElementById("btn-gallery");
    if (btnGallery) btnGallery.addEventListener("click", () => selectAndUploadPhoto(false));

    // Bottom Sheet Logic (Unchanged)
    const btnCollection = document.getElementById("btn-collection");
    const bottomSheet = document.getElementById("bottom-sheet");
    const dragHandle = document.querySelector(".sheet-drag-handle");
    let isSheetOpen = false;

    function toggleSheet() {
        isSheetOpen = !isSheetOpen;
        if (isSheetOpen) bottomSheet.classList.add("open");
        else bottomSheet.classList.remove("open");
    }

    btnCollection.addEventListener("click", toggleSheet);
    dragHandle.addEventListener("click", toggleSheet);

    let startY = 0, currentY = 0, isDragging = false;
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
        if (deltaY > 0) bottomSheet.style.transform = `translateY(${deltaY}px)`;
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