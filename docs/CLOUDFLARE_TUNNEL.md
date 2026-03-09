# Configurar Cloudflare Tunnel para svmpbooking

Permite exponer tu app en localhost con una URL pública HTTPS (ej. `https://svmpbooking-tu-subdominio.trycloudflare.com` o un subdominio propio). Útil para probar Unified Checkout de CyberSource en un origen HTTPS.

---

## Si estás en WSL

En WSL funciona igual que en Linux. Sigue estos puntos:

1. **Instala y ejecuta todo dentro de WSL**  
   Instala `cloudflared` en WSL (paso 1 de Opción A) y corre tanto `npm run dev` como `cloudflared tunnel --url http://localhost:5173` desde terminales en WSL. Así `localhost` en el túnel apunta a tu app en WSL.

2. **Que Vite escuche en todas las interfaces (por si acaso)**  
   Si algo no conecta, en el proyecto puedes arrancar el dev con:
   ```bash
   npm run dev -- --host
   ```
   (Vite escuchará en `0.0.0.0` y seguirás entrando por `http://localhost:5173` desde WSL.)

3. **Si corres `npm run dev` en Windows y `cloudflared` en WSL**  
   Desde WSL, `localhost` es el propio WSL, no Windows. En ese caso usa la IP del host Windows. En WSL2 la puedes ver con:
   ```bash
   cat /etc/resolv.conf | grep nameserver | awk '{ print $2 }'
   ```
   Luego:
   ```bash
   cloudflared tunnel --url http://<ESA_IP>:5173
   ```
   Lo más simple: **corre dev y tunnel los dos en WSL**.

4. **Abrir la URL del túnel**  
   La URL `https://....trycloudflare.com` puedes abrirla tanto en el navegador de Windows como en el de WSL; Cloudflare ya te da HTTPS.

---

## Opción A: Tunnel rápido (sin cuenta Cloudflare)

### 1. Instalar `cloudflared`

**Linux (WSL/Ubuntu/Debian):**
```bash
# Descargar e instalar el binario
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
cloudflared --version
```

**macOS (Homebrew):**
```bash
brew install cloudflared
```

**Windows:** Descarga desde [Releases de cloudflared](https://github.com/cloudflare/cloudflared/releases).

### 2. Arrancar la app en local

En una terminal:
```bash
npm run dev
```
(SvelteKit suele quedar en `http://localhost:5173`.)

### 3. Crear el túnel

En **otra** terminal, desde la raíz del proyecto (o cualquier ruta):
```bash
cloudflared tunnel --url http://localhost:5173
```

Verás algo como:
```
Your quick Tunnel has been created! Visit it at:
https://xxxx-xx-xx-xx-xx.trycloudflare.com
```

### 4. Usar la URL

- Abre esa URL en el navegador: es tu app en local, por HTTPS.
- Esa URL es la que debes poner en **targetOrigins** en el backend de CyberSource (o al menos probar que el iframe cargue).
- La URL cambia cada vez que reinicias el túnel (en el modo rápido).

---

## Opción B: Tunnel con cuenta Cloudflare (subdominio fijo)

Si tienes un dominio en Cloudflare (ej. `midominio.com`), puedes tener una URL fija como `https://svmpbooking.midominio.com`.

### 1. Iniciar sesión en Cloudflare

```bash
cloudflared tunnel login
```
Se abrirá el navegador para autorizar; el certificado se guarda en `~/.cloudflared/`.

### 2. Crear un túnel con nombre

```bash
cloudflared tunnel create svmpbooking
```
Anota el **Tunnel ID** que te muestre.

### 3. Crear el archivo de configuración

Crea `~/.cloudflared/config.yml` (o en la raíz del proyecto un `config.yml` y luego lo referencias):

```yaml
tunnel: <TU_TUNNEL_ID>
credentials-file: /home/tu-usuario/.cloudflared/<TU_TUNNEL_ID>.json

ingress:
  - hostname: svmpbooking.midominio.com
    service: http://localhost:5173
  - service: http_status:404
```

Sustituye:
- `<TU_TUNNEL_ID>` por el ID del paso 2.
- `svmpbooking.midominio.com` por el subdominio que quieras.
- La ruta de `credentials-file` por la ruta real del archivo `.json` que se generó en `~/.cloudflared/`.

### 4. Crear el registro DNS en Cloudflare

En el dashboard de Cloudflare → tu dominio → DNS:

- Tipo: **CNAME**
- Nombre: `svmpbooking` (o el subdominio que uses)
- Contenido: `<TU_TUNNEL_ID>.cfargotunnel.com`
- Proxy: activado (nube naranja)

### 5. Arrancar el túnel

Con la app corriendo (`npm run dev`):

```bash
cloudflared tunnel run svmpbooking
```

O usando el archivo de config explícito:

```bash
cloudflared tunnel --config ~/.cloudflared/config.yml run
```

Tu app quedará en `https://svmpbooking.midominio.com`.

---

## Resumen rápido (solo probar CyberSource)

1. `npm run dev`
2. En otra terminal: `cloudflared tunnel --url http://localhost:5173`
3. Usar la URL `https://...trycloudflare.com` que te muestre.
4. En el backend que genera el Capture Context, añadir esa URL en **targetOrigins** (o configurar el backend para que en desarrollo use esa URL).

---

## Notas

- El túnel solo funciona mientras `cloudflared` esté en ejecución.
- Con tunnel rápido, la URL es temporal; con tunnel nombrado + dominio Cloudflare, la URL es fija.
- Si cambias el puerto de Vite (ej. 3000), usa ese puerto en `--url` (ej. `http://localhost:3000`).
