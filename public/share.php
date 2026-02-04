<?php
// share.php - Dynamic Open Graph Tags for GoDaddy/cPanel Hosting

// Supabase Credentials (from config.ts)
$supabaseUrl = 'https://tfmaotjdfpqtnsghdwnl.supabase.co';
$supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbWFvdGpkZnBxdG5zZ2hkd25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDA4NjcsImV4cCI6MjA3NjcxNjg2N30.yArp2rMTnq5uviIv5hrY9GGwv4yljDgiOAm8xEGN8hM';

// Get Car ID from URL (e.g., share.php?id=123)
$carId = isset($_GET['id']) ? $_GET['id'] : null;

// Default Meta (Fallback)
$metaTitle = "PickMyCar - Find Your Perfect Used Car";
$metaDesc = "Discover certified used cars across India with warranty assured.";
$metaImage = "https://pickmycar.co.in/og-image.png";
$redirectUrl = "https://pickmycar.co.in/";

if ($carId) {
    // Fetch Car Data from Supabase
    $apiEndpoint = "$supabaseUrl/rest/v1/car_listings?id=eq.$carId&select=title,price,brand,model,year,images,city";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiEndpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        "apikey: $supabaseKey",
        "Authorization: Bearer $supabaseKey",
        "Content-Type: application/json"
    ));
    
    $response = curl_exec($ch);
    curl_close($ch);
    
    $data = json_decode($response, true);
    
    if (!empty($data) && isset($data[0])) {
        $car = $data[0];
        
        // Format Price (e.g. 5.50 Lakh)
        $price = $car['price'];
        if ($price >= 10000000) {
            $formattedPrice = number_format($price / 10000000, 2) . ' Cr';
        } else {
            $formattedPrice = number_format($price / 100000, 2) . ' Lakh';
        }
        
        $metaTitle = "{$car['year']} {$car['brand']} {$car['model']} - ₹{$formattedPrice}";
        $metaDesc = "Check out this {$car['title']} in {$car['city']} on PickMyCar. Verified, Inspected, and ready to drive!";
        
        // Handle Image Array (Supabase usually stores as array or JSON)
        // Adjust based on your actual DB schema. Assuming 'images' is text[] or jsonb
        if (!empty($car['images']) && is_array($car['images'])) {
             $metaImage = $car['images'][0];
        } elseif (!empty($car['images']) && is_string($car['images'])) {
             // Handle if stored as JSON string or single URL
             // Simple check if it starts with [
             if (strpos($car['images'], '[') === 0) {
                 $imgs = json_decode($car['images'], true);
                 $metaImage = $imgs[0] ?? $metaImage;
             } else {
                 $metaImage = $car['images'];
             }
        }

        $redirectUrl = "https://pickmycar.co.in/car/$carId";
    }
} else {
    // If no ID, redirect home
    header("Location: https://pickmycar.co.in/");
    exit();
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website" />
    <meta property="og:url" content="<?php echo $redirectUrl; ?>" />
    <meta property="og:title" content="<?php echo htmlspecialchars($metaTitle); ?>" />
    <meta property="og:description" content="<?php echo htmlspecialchars($metaDesc); ?>" />
    <meta property="og:image" content="<?php echo htmlspecialchars($metaImage); ?>" />
    
    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="<?php echo htmlspecialchars($metaTitle); ?>" />
    <meta name="twitter:description" content="<?php echo htmlspecialchars($metaDesc); ?>" />
    <meta name="twitter:image" content="<?php echo htmlspecialchars($metaImage); ?>" />
    
    <!-- WhatsApp Preview improvements -->
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    
    <title><?php echo htmlspecialchars($metaTitle); ?></title>
    
    <!-- Redirect to actual app -->
    <script>
        window.location.href = "<?php echo $redirectUrl; ?>";
    </script>
</head>
<body>
    <p>Redirecting to PickMyCar...</p>
</body>
</html>
