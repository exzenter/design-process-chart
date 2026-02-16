<?php
/**
 * Plugin Name:       Process Timeline Block
 * Description:       Interactive process timeline with bubble visualization for Gutenberg.
 * Requires at least: 6.1
 * Requires PHP:      7.0
 * Version:           1.0.0
 * Plugin URI:        https://exzent.de/plugins/
 * Author:            EXZENT
 * Author URI:        https://exzent.de
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       process-timeline-block
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

function ppt_render_block( $attributes ) {
	$steps      = wp_json_encode( isset( $attributes['timelineSteps'] ) ? $attributes['timelineSteps'] : array() );
	$phases     = wp_json_encode( isset( $attributes['phases'] ) ? $attributes['phases'] : new stdClass() );
	$settings   = wp_json_encode( isset( $attributes['settings'] ) ? $attributes['settings'] : new stdClass() );
	$versions   = wp_json_encode( isset( $attributes['versions'] ) ? $attributes['versions'] : new stdClass() );

	$desktop_layout = isset( $attributes['desktopLayout'] ) ? $attributes['desktopLayout'] : 'horizontal';
	$mobile_layout  = isset( $attributes['mobileLayout'] ) ? $attributes['mobileLayout'] : 'vertical';
	$breakpoint     = isset( $attributes['responsiveBreakpoint'] ) ? intval( $attributes['responsiveBreakpoint'] ) : 768;

	$responsive = wp_json_encode( array(
		'breakpoint'    => $breakpoint,
		'mobileLayout'  => $mobile_layout,
		'desktopLayout' => $desktop_layout,
	) );

	$show_toggle   = ! empty( $attributes['showViewToggle'] );
	$show_versions = ! empty( $attributes['showVersionButtons'] );

	$align_class = '';
	if ( ! empty( $attributes['align'] ) ) {
		$align_class = ' align' . esc_attr( $attributes['align'] );
	}

	$wrapper_attrs = get_block_wrapper_attributes( array(
		'class'            => 'ppt-block' . $align_class,
		'data-steps'       => $steps,
		'data-phases'      => $phases,
		'data-settings'    => $settings,
		'data-versions'    => $versions,
		'data-responsive'  => $responsive,
	) );

	$controls = '';
	if ( $show_toggle || $show_versions ) {
		$controls .= '<div class="ppt-controls">';
		if ( $show_toggle ) {
			$h_active = ( 'horizontal' === $desktop_layout ) ? ' active' : '';
			$v_active = ( 'vertical' === $desktop_layout ) ? ' active' : '';
			$controls .= '<div class="ppt-view-toggle">';
			$controls .= '<button class="ppt-view-btn' . $h_active . '" data-view="horizontal">Horizontal</button>';
			$controls .= '<button class="ppt-view-btn' . $v_active . '" data-view="vertical">Vertical</button>';
			$controls .= '</div>';
		}
		if ( $show_versions ) {
			$controls .= '<div class="ppt-version-buttons"></div>';
		}
		$controls .= '</div>';
	}

	return sprintf(
		'<div %s>%s<div class="ppt-timeline-wrapper"><div class="ppt-timeline-container"></div></div></div>',
		$wrapper_attrs,
		$controls
	);
}

function ppt_register_block() {
	register_block_type( __DIR__ . '/build', array(
		'render_callback' => 'ppt_render_block',
	) );
}
add_action( 'init', 'ppt_register_block' );
