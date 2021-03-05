'use strict';
const MANIFEST = 'flutter-app-manifest';
const TEMP = 'flutter-temp-cache';
const CACHE_NAME = 'flutter-app-cache';
const RESOURCES = {
  "main.dart.js": "e900be7a2a09f2f89cbf3c1375351244",
"icons/Icon-192.png": "fcfd9515e216757d0c405b04a0741a21",
"icons/Icon-512.png": "529f9281c7bd448463c995b47c9befe4",
"assets/NOTICES": "6c150b93fc734fb480fc82f23bb64688",
"assets/fonts/MaterialIcons-Regular.otf": "1288c9e28052e028aba623321f7826ac",
"assets/FontManifest.json": "7b2a36307916a9721811788013e65289",
"assets/AssetManifest.json": "0baa1585842fc3f19ac797976f68e6d0",
"assets/resources/images/shoe_size.png": "d189f8dac179d2fc68ab257f5192d537",
"assets/resources/images/angles.png": "f8a0c60156c1d7a67f6781422b785f8c",
"assets/resources/images/data.png": "cb5d3bfa5d85090037d249f234596f87",
"assets/resources/images/pressure.png": "a98980f0401565315a9e9bfb48627ffa",
"assets/resources/images/prefixes.png": "69a1b0eed46990d3ff841d2c328cf94a",
"assets/resources/images/calculator.png": "5080b8b64bfb548edabd5f354018f2a0",
"assets/resources/images/currencies.png": "99a5c05753997b4ce9ce8097686c38ca",
"assets/resources/images/time.png": "62219900f6e903a5ca20710b1a9b6aa1",
"assets/resources/images/speed.png": "a5dbe972024e38c2a26dd9854eb22438",
"assets/resources/images/temperature.png": "1ec875c848337b5a1e5196e78ff9cd7f",
"assets/resources/images/power.png": "92138ef7faa7e8f6fd136c265d7c4932",
"assets/resources/images/energy.png": "103ed054f04d796a0c91d169e07fca80",
"assets/resources/images/num_systems.png": "b82321121be9324d77b9a9a39b4c5228",
"assets/resources/images/volume.png": "4241670b1d26ac8ca9dfd6a24e7b4b86",
"assets/resources/images/mass.png": "563a37b10d72222dee86a42b251d9441",
"assets/resources/images/torque.png": "48c7d3cb1c1c2866b166de7d8e995075",
"assets/resources/images/length.png": "2d57f006df44e79fa5a3b243a63bfcf1",
"assets/resources/images/force.png": "63a1463fe0d29ca96122e74bf1e45605",
"assets/resources/images/area.png": "fa724188ecbd91ecdbde6c0478ce26e3",
"assets/resources/images/logo.png": "59b984028582182089ccdfbbc46f10c7",
"assets/resources/images/fuel.png": "d557b7b8da7a9887bb5dfa73c83c9e61",
"version.json": "e6d8d45f3c50626e9dcab5f0e50b4b00",
"manifest.json": "eb6abaa5ba0c5f8ab8ee1378d297fcb7",
"favicon.png": "9e118249f3d09c38b28095dbb5c14a7e",
"index.html": "0536f1813698ffcfe7c6e9ed30731f1a",
"/": "0536f1813698ffcfe7c6e9ed30731f1a"
};

// The application shell files that are downloaded before a service worker can
// start.
const CORE = [
"main.dart.js",
"index.html",
"assets/NOTICES",
"assets/AssetManifest.json",
"assets/FontManifest.json"];
// During install, the TEMP cache is populated with the application shell files.
self.addEventListener("install", (event) => {
  self.skipWaiting();
  return event.waitUntil(
    caches.open(TEMP).then((cache) => {
      return cache.addAll(
        CORE.map((value) => new Request(value + '?revision=' + RESOURCES[value], {'cache': 'reload'})));
    })
  );
});

// During activate, the cache is populated with the temp files downloaded in
// install. If this service worker is upgrading from one with a saved
// MANIFEST, then use this to retain unchanged resource files.
self.addEventListener("activate", function(event) {
  return event.waitUntil(async function() {
    try {
      var contentCache = await caches.open(CACHE_NAME);
      var tempCache = await caches.open(TEMP);
      var manifestCache = await caches.open(MANIFEST);
      var manifest = await manifestCache.match('manifest');
      // When there is no prior manifest, clear the entire cache.
      if (!manifest) {
        await caches.delete(CACHE_NAME);
        contentCache = await caches.open(CACHE_NAME);
        for (var request of await tempCache.keys()) {
          var response = await tempCache.match(request);
          await contentCache.put(request, response);
        }
        await caches.delete(TEMP);
        // Save the manifest to make future upgrades efficient.
        await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
        return;
      }
      var oldManifest = await manifest.json();
      var origin = self.location.origin;
      for (var request of await contentCache.keys()) {
        var key = request.url.substring(origin.length + 1);
        if (key == "") {
          key = "/";
        }
        // If a resource from the old manifest is not in the new cache, or if
        // the MD5 sum has changed, delete it. Otherwise the resource is left
        // in the cache and can be reused by the new service worker.
        if (!RESOURCES[key] || RESOURCES[key] != oldManifest[key]) {
          await contentCache.delete(request);
        }
      }
      // Populate the cache with the app shell TEMP files, potentially overwriting
      // cache files preserved above.
      for (var request of await tempCache.keys()) {
        var response = await tempCache.match(request);
        await contentCache.put(request, response);
      }
      await caches.delete(TEMP);
      // Save the manifest to make future upgrades efficient.
      await manifestCache.put('manifest', new Response(JSON.stringify(RESOURCES)));
      return;
    } catch (err) {
      // On an unhandled exception the state of the cache cannot be guaranteed.
      console.error('Failed to upgrade service worker: ' + err);
      await caches.delete(CACHE_NAME);
      await caches.delete(TEMP);
      await caches.delete(MANIFEST);
    }
  }());
});

// The fetch handler redirects requests for RESOURCE files to the service
// worker cache.
self.addEventListener("fetch", (event) => {
  if (event.request.method !== 'GET') {
    return;
  }
  var origin = self.location.origin;
  var key = event.request.url.substring(origin.length + 1);
  // Redirect URLs to the index.html
  if (key.indexOf('?v=') != -1) {
    key = key.split('?v=')[0];
  }
  if (event.request.url == origin || event.request.url.startsWith(origin + '/#') || key == '') {
    key = '/';
  }
  // If the URL is not the RESOURCE list then return to signal that the
  // browser should take over.
  if (!RESOURCES[key]) {
    return;
  }
  // If the URL is the index.html, perform an online-first request.
  if (key == '/') {
    return onlineFirst(event);
  }
  event.respondWith(caches.open(CACHE_NAME)
    .then((cache) =>  {
      return cache.match(event.request).then((response) => {
        // Either respond with the cached resource, or perform a fetch and
        // lazily populate the cache.
        return response || fetch(event.request).then((response) => {
          cache.put(event.request, response.clone());
          return response;
        });
      })
    })
  );
});

self.addEventListener('message', (event) => {
  // SkipWaiting can be used to immediately activate a waiting service worker.
  // This will also require a page refresh triggered by the main worker.
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
    return;
  }
  if (event.data === 'downloadOffline') {
    downloadOffline();
    return;
  }
});

// Download offline will check the RESOURCES for all files not in the cache
// and populate them.
async function downloadOffline() {
  var resources = [];
  var contentCache = await caches.open(CACHE_NAME);
  var currentContent = {};
  for (var request of await contentCache.keys()) {
    var key = request.url.substring(origin.length + 1);
    if (key == "") {
      key = "/";
    }
    currentContent[key] = true;
  }
  for (var resourceKey of Object.keys(RESOURCES)) {
    if (!currentContent[resourceKey]) {
      resources.push(resourceKey);
    }
  }
  return contentCache.addAll(resources);
}

// Attempt to download the resource online before falling back to
// the offline cache.
function onlineFirst(event) {
  return event.respondWith(
    fetch(event.request).then((response) => {
      return caches.open(CACHE_NAME).then((cache) => {
        cache.put(event.request, response.clone());
        return response;
      });
    }).catch((error) => {
      return caches.open(CACHE_NAME).then((cache) => {
        return cache.match(event.request).then((response) => {
          if (response != null) {
            return response;
          }
          throw error;
        });
      });
    })
  );
}