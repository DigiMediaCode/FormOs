<?php
/**
 * Gutenberg block for FormOS Embed.
 *
 * @package FormOSEmbed
 */

if (!defined('ABSPATH')) {
    exit;
}

class FormOS_Embed_Block {
    public static function init() {
        add_action('init', array(__CLASS__, 'register_block'));
    }

    public static function register_block() {
        wp_register_script(
            'formos-embed-block',
            FORMOS_EMBED_PLUGIN_URL . 'assets/block.js',
            array('wp-api-fetch', 'wp-blocks', 'wp-block-editor', 'wp-components', 'wp-element', 'wp-i18n'),
            FORMOS_EMBED_VERSION,
            true
        );

        wp_localize_script(
            'formos-embed-block',
            'formosEmbedBlock',
            array(
                'formsEndpoint' => esc_url_raw(rest_url('formos-embed/v1/forms')),
                'hasConnection' => FormOS_Embed_Settings::has_connection(),
                'settingsUrl' => esc_url_raw(admin_url('options-general.php?page=formos-embed')),
            )
        );

        register_block_type(
            'formos/embed-form',
            array(
                'api_version' => 2,
                'editor_script' => 'formos-embed-block',
                'attributes' => array(
                    'formId' => array(
                        'type' => 'string',
                        'default' => '',
                    ),
                    'height' => array(
                        'type' => 'number',
                        'default' => 800,
                    ),
                    'useJs' => array(
                        'type' => 'boolean',
                        'default' => false,
                    ),
                    'theme' => array(
                        'type' => 'string',
                        'default' => '',
                    ),
                    'accent' => array(
                        'type' => 'string',
                        'default' => '',
                    ),
                    'background' => array(
                        'type' => 'string',
                        'default' => '',
                    ),
                    'surface' => array(
                        'type' => 'string',
                        'default' => '',
                    ),
                    'text' => array(
                        'type' => 'string',
                        'default' => '',
                    ),
                    'border' => array(
                        'type' => 'string',
                        'default' => '',
                    ),
                    'radius' => array(
                        'type' => 'string',
                        'default' => '',
                    ),
                    'compact' => array(
                        'type' => 'boolean',
                        'default' => false,
                    ),
                    'font' => array(
                        'type' => 'string',
                        'default' => '',
                    ),
                ),
                'render_callback' => array(__CLASS__, 'render'),
            )
        );
    }

    public static function render($attributes) {
        $form_id = isset($attributes['formId'])
            ? sanitize_text_field((string) $attributes['formId'])
            : '';
        $height = isset($attributes['height']) ? absint($attributes['height']) : 800;
        $use_js = !empty($attributes['useJs']) ? 'true' : 'false';
        $shortcode_attributes = array(
            'id' => $form_id,
            'height' => $height,
            'js' => $use_js,
        );

        foreach (
            array(
                'theme' => 'theme',
                'accent' => 'accent',
                'background' => 'bg',
                'surface' => 'surface',
                'text' => 'text',
                'border' => 'border',
                'radius' => 'radius',
                'font' => 'font',
            ) as $attribute_key => $shortcode_key
        ) {
            if (!empty($attributes[$attribute_key])) {
                $shortcode_attributes[$shortcode_key] = sanitize_text_field((string) $attributes[$attribute_key]);
            }
        }

        if (!empty($attributes['compact'])) {
            $shortcode_attributes['compact'] = 'true';
        }

        return FormOS_Embed_Shortcode::render($shortcode_attributes);
    }
}
