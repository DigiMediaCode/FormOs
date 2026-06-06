<?php
/**
 * Plugin Name: FormOS Embed
 * Plugin URI: https://formos.com.au
 * Description: Embed FormOS forms in WordPress pages and posts using a shortcode.
 * Version: 0.1.0
 * Author: FormOS
 * License: GPL-2.0-or-later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: formos-embed
 *
 * @package FormOSEmbed
 */

if (!defined('ABSPATH')) {
    exit;
}

define('FORMOS_EMBED_VERSION', '0.1.0');
define('FORMOS_EMBED_PLUGIN_FILE', __FILE__);
define('FORMOS_EMBED_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('FORMOS_EMBED_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once FORMOS_EMBED_PLUGIN_DIR . 'includes/class-formos-embed-settings.php';
require_once FORMOS_EMBED_PLUGIN_DIR . 'includes/class-formos-embed-shortcode.php';
require_once FORMOS_EMBED_PLUGIN_DIR . 'includes/class-formos-embed-block.php';

function formos_embed_bootstrap() {
    FormOS_Embed_Settings::init();
    FormOS_Embed_Shortcode::init();
    FormOS_Embed_Block::init();
}
add_action('plugins_loaded', 'formos_embed_bootstrap');

function formos_embed_activate() {
    $existing = get_option(FormOS_Embed_Settings::OPTION_NAME);

    if (is_array($existing)) {
        return;
    }

    add_option(
        FormOS_Embed_Settings::OPTION_NAME,
        array(
            'base_url' => '',
            'default_height' => 800,
            'use_auto_height' => 0,
        )
    );
}
register_activation_hook(__FILE__, 'formos_embed_activate');
