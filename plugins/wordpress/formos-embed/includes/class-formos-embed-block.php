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
            array('wp-blocks', 'wp-block-editor', 'wp-components', 'wp-element', 'wp-i18n'),
            FORMOS_EMBED_VERSION,
            true
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

        return FormOS_Embed_Shortcode::render(
            array(
                'id' => $form_id,
                'height' => $height,
                'js' => $use_js,
            )
        );
    }
}
