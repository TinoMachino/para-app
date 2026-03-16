import React, {useEffect, useImperativeHandle} from 'react'
import {findNodeHandle, View} from 'react-native'

import {HIGHLIGHTS as MOCK_HIGHLIGHTS} from '#/lib/mock-data'
import {List} from '#/view/com/util/List'
import {type ListRef} from '#/view/com/util/List'
import {atoms as a, useTheme} from '#/alf'
import {Text} from '#/components/Typography'
import {IS_IOS} from '#/env'
import {type SectionRef} from './types'

interface Props {
  headerHeight: number
  scrollElRef: ListRef
  setScrollViewTag: (tag: number | null) => void
  isFocused: boolean
}

export const ProfileHighlightsSection = React.forwardRef<SectionRef, Props>(
  function ProfileHighlightsSection(
    {headerHeight, scrollElRef, setScrollViewTag, isFocused},
    ref,
  ) {
    const t = useTheme()

    useImperativeHandle(ref, () => ({
      scrollToTop: () => {
        scrollElRef.current?.scrollToOffset({
          offset: -headerHeight,
          animated: true,
        })
      },
    }))

    useEffect(() => {
      if (IS_IOS && isFocused && scrollElRef.current) {
        // @ts-ignore
        const nativeTag = findNodeHandle(scrollElRef.current)
        setScrollViewTag(nativeTag)
      }
    }, [isFocused, scrollElRef, setScrollViewTag])

    const renderItem = ({item}: {item: (typeof MOCK_HIGHLIGHTS)[0]}) => (
      <View style={[a.p_md, a.border_b, t.atoms.border_contrast_low]}>
        <View style={[a.flex_row, a.justify_between]}>
          <Text style={[a.text_xs, {color: item.color}, a.font_bold]}>
            {item.community}
          </Text>
          <Text style={[a.text_xs, t.atoms.text_contrast_low]}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={[a.text_md, a.mt_xs]}>{item.text}</Text>
        <Text style={[a.text_sm, t.atoms.text_contrast_medium, a.mt_xs]}>
          @{item.postAuthor}
        </Text>
      </View>
    )

    return (
      <List
        ref={scrollElRef}
        data={MOCK_HIGHLIGHTS.slice(0, 5)} // Show first 5 mocks
        renderItem={renderItem}
        keyExtractor={item => item.id}
        headerOffset={headerHeight}
        contentContainerStyle={{
          minHeight: '100%',
          paddingBottom: 100,
        }}
      />
    )
  },
)
