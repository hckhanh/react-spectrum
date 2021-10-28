/*
 * Copyright 2020 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {ActionButton} from '@react-spectrum/button';
import {ActionGroup} from '@react-spectrum/actiongroup';
import {announce} from '@react-aria/live-announcer';
import {classNames, unwrapDOMRef, useDOMRef, useStyleProps} from '@react-spectrum/utils';
import CrossLarge from '@spectrum-icons/ui/CrossLarge';
import {DOMRef, DOMRefValue} from '@react-types/shared';
import {filterDOMProps} from '@react-aria/utils';
import {FocusScope} from '@react-aria/focus';
// @ts-ignore
import intlMessages from '../intl/*.json';
import {OpenTransition} from '@react-spectrum/overlays';
import React, {ReactElement, RefObject, useEffect, useRef} from 'react';
import {SpectrumActionBarProps} from '@react-types/actionbar';
import styles from './actionbar.css';
import {Text} from '@react-spectrum/text';
import {useKeyboard} from '@react-aria/interactions';
import {useMessageFormatter} from '@react-aria/i18n';
import {useProviderProps} from '@react-spectrum/provider';

function ActionBar<T extends object>(props: SpectrumActionBarProps<T>, ref: DOMRef<HTMLDivElement>) {
  let isOpen = props.selectedItemCount !== 0;
  let lastActiveElementRef = useRef<HTMLElement>(null);
  let {restoreFocusRef} = props;

  return (
    <OpenTransition
      in={isOpen}
      onEnter={() => lastActiveElementRef.current = document.activeElement as HTMLElement}
      onExit={() => {
        // prioritize explicit restoreFocusRef to restore focus
        if (restoreFocusRef && restoreFocusRef.current) {
          let domNode:HTMLElement;

          // For React reference, try unwrapDOMRef to access the DOM node.
          try {
            domNode = unwrapDOMRef(restoreFocusRef as RefObject<DOMRefValue<HTMLElement>>).current;
          } catch (error) {
            // Otherwise, if we have an HTMLElement ref, use it as the DOM node.
            if (restoreFocusRef.current instanceof HTMLElement) {
              domNode = restoreFocusRef.current;
            } 
          }
          if (document.body.contains(domNode) && typeof domNode.focus === 'function') {
            domNode.focus();
            return;
          }
        }

        // Otherwise, try to restore focus to the lastActiveElementRef set onEnter. 
        if (document.body.contains(lastActiveElementRef.current) && typeof lastActiveElementRef.current.focus === 'function') {
          lastActiveElementRef.current.focus();
        }
      }}
      mountOnEnter
      unmountOnExit>
      <ActionBarInner {...props} ref={ref} />
    </OpenTransition>
  );
}

interface ActionBarInnerProps extends SpectrumActionBarProps<unknown> {
  isOpen?: boolean
}

const ActionBarInner = React.forwardRef((props: ActionBarInnerProps, ref: DOMRef<HTMLDivElement>) => {
  props = useProviderProps(props);

  let {
    children,
    isEmphasized,
    onAction,
    onClearSelection,
    selectedItemCount,
    isOpen
  } = props;

  let {styleProps} = useStyleProps(props);
  let domRef = useDOMRef(ref);
  let formatMessage = useMessageFormatter(intlMessages);

  // Store the last count greater than zero in a ref so that we can retain it while rendering the fade-out animation.
  let lastCount = useRef(selectedItemCount);
  if (selectedItemCount === 'all' || selectedItemCount > 0) {
    lastCount.current = selectedItemCount;
  }

  let {keyboardProps} = useKeyboard({
    onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClearSelection();
      }
    }
  });

  // Announce "actions available" on mount.
  useEffect(() => {
    announce(formatMessage('actionsAvailable'));
  }, [formatMessage]);

  return (
    <FocusScope restoreFocus>
      <div
        {...filterDOMProps(props)}
        {...styleProps}
        {...keyboardProps}
        ref={domRef}
        className={classNames(
          styles,
          'react-spectrum-ActionBar', {
            'react-spectrum-ActionBar--emphasized': isEmphasized,
            'is-open': isOpen
          },
          styleProps.className
        )}>
        <div className={classNames(styles, 'react-spectrum-ActionBar-bar')}>
          <ActionGroup
            aria-label={formatMessage('actions')}
            isQuiet
            staticColor={isEmphasized ? 'white' : null}
            overflowMode="collapse"
            buttonLabelBehavior="collapse"
            onAction={onAction}
            UNSAFE_className={classNames(styles, 'react-spectrum-ActionBar-actionGroup')}>
            {children}
          </ActionGroup>
          <ActionButton
            gridArea="clear"
            aria-label={formatMessage('clearSelection')}
            onPress={() => onClearSelection()}
            isQuiet
            staticColor={isEmphasized ? 'white' : null}>
            <CrossLarge />
          </ActionButton>
          <Text UNSAFE_className={classNames(styles, 'react-spectrum-ActionBar-selectedCount')}>
            {lastCount.current === 'all'
              ? formatMessage('selectedAll')
              : formatMessage('selected', {count: lastCount.current})}
          </Text>
        </div>
      </div>
    </FocusScope>
  );
});

/**
 * TODO: Add description of component here.
 */
const _ActionBar = React.forwardRef(ActionBar) as <T>(props: SpectrumActionBarProps<T> & {ref?: DOMRef<HTMLDivElement>}) => ReactElement;
export {_ActionBar as ActionBar};
