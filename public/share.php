<?php
// share.php - Dynamic Open Graph Tags for GoDaddy/cPanel Hosting

// Supabase Credentials (from config.ts)
$supabaseUrl = 'https://tfmaotjdfpqtnsghdwnl.supabase.co';
$supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmbWFvdGpkZnBxdG5zZ2hkd25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExNDA4NjcsImV4cCI6MjA3NjcxNjg2N30.yArp2rMTnq5uviIv5hrY9GGwv4yljDgiOAm8xEGN8hM';

// Get Car ID from URL (e.g., share.php?id=123)
$carId = isset($_GET['id']) ? $_GET['id'] : null;
$debug = isset($_GET['debug']) && $_GET['debug'] == 'true';

// Default Meta (Fallback)
$metaTitle = "PickMyCar - Find Your Perfect Used Car";
$metaDesc = "Discover certified used cars across India with warranty assured, easy financing, and hassle-free insurance.";
$metaImage = "https://pickmycar.co.in/og-image.png";
$redirectUrl = "https://pickmycar.co.in/";

if ($carId) {
    // UPDATED: Use the VIEW 'car_listings_detailed' instead of raw table
    // UPDATED: Correct column names (expected_price, photos)
    $apiEndpoint = "$supabaseUrl/rest/v1/car_listings_detailed?id=eq.$carId&select=title,expected_price,brand_name,model_name,year_of_make,city_name,photos";
    
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $apiEndpoint);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    curl_setopt($ch, CURLOPT_HTTPHEADER, array(
        "apikey: $supabaseKey",
        "Authorization: Bearer $supabaseKey",
        "Content-Type: application/json"
    ));
    
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    
    if ($debug) {
        echo "<h1>Debug Info</h1>";
        echo "<p>API: $apiEndpoint</p>";
        echo "<p>HTTP Code: $httpCode</p>";
        echo "<pre>Response: $response</pre>";
    }
    
    $data = json_decode($response, true);
    
    if (!empty($data) && isset($data[0])) {
        $car = $data[0];
        
        // Format Price (e.g. 5.50 Lakh) using 'expected_price'
        $price = isset($car['expected_price']) ? $car['expected_price'] : 0;
        
        if ($price >= 10000000) {
            $formattedPrice = number_format($price / 10000000, 2) . ' Cr';
        } else {
            $formattedPrice = number_format($price / 100000, 2) . ' Lakh';
        }
        
        // Use flattened view columns: brand_name, model_name
        $brand = isset($car['brand_name']) ? $car['brand_name'] : 'Car';
        $model = isset($car['model_name']) ? $car['model_name'] : '';
        $year = isset($car['year_of_make']) ? $car['year_of_make'] : '';
        $city = isset($car['city_name']) ? $car['city_name'] : '';
        $title = isset($car['title']) ? $car['title'] : "$brand $model";

        $metaTitle = "$year $brand $model - ₹$formattedPrice";
        $metaDesc = "Check out this $title in $city on PickMyCar. Verified, Inspected, and ready to drive!";
        
        // Handle Photos (Column is 'photos')
        if (!empty($car['photos'])) {
             // If photos is already an array (from JSON response)
             if (is_array($car['photos'])) {
                 $firstPhoto = $car['photos'][0];
                 // Check if it's an object with 'url' (ImageUpload interface)
                 if (is_array($firstPhoto) && isset($firstPhoto['url'])) {
                     $metaImage = $firstPhoto['url'];
                 } elseif (is_object($firstPhoto) && isset($firstPhoto->url)) {
                     $metaImage = $firstPhoto->url;
                 } else {
                     // Maybe it's just a string URL?
                     $metaImage = $firstPhoto;
                 }
             } elseif (is_string($car['photos'])) {
                 // If it's a JSON string
                 $photos = json_decode($car['photos'], true);
                 if (!empty($photos) && isset($photos[0]['url'])) {
                     $metaImage = $photos[0]['url'];
                 }
             }
        }

        $redirectUrl = "https://pickmycar.co.in/car/$carId";
    } elseif ($debug) {
        echo "<p>No data found for ID: $carId</p>";
        exit;
    }
} else {
    // If no ID, redirect home
    if (!$debug) {
        header("Location: https://pickmycar.co.in/");
        exit();
    }
}

if ($debug) exit; // Stop here if debugging
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
