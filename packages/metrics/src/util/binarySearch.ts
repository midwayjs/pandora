// code from java Arrays
/**
 * Searches the specified array of doubles for the specified value using
 * the binary search algorithm.  The array must be sorted
 * (as by the {@link #sort(double[])} method) prior to making this call.
 * If it is not sorted, the results are undefined.  If the array contains
 * multiple elements with the specified value, there is no guarantee which
 * one will be found.  This method considers all NaN values to be
 * equivalent and equal.
 *
 * @param a the array to be searched
 * @param key the value to be searched for
 * @return index of the search key, if it is contained in the array;
 *         otherwise, <tt>(-(<i>insertion point</i>) - 1)</tt>.  The
 *         <i>insertion point</i> is defined as the point at which the
 *         key would be inserted into the array: the index of the first
 *         element greater than the key, or <tt>a.length</tt> if all
 *         elements in the array are less than the specified key.  Note
 *         that this guarantees that the return value will be &gt;= 0 if
 *         and only if the key is found.
 */
export function binarySearch(a: Array<number>, key: number) {

    let fromIndex: number = 0;
    let toIndex: number = a.length;

    let low = fromIndex;
    let high = toIndex - 1;

    while (low <= high) {
        let mid = (low + high) >>> 1;
        let midVal = a[mid];

        if (midVal < key) {
            low = mid + 1; // Neither val is NaN, thisVal is smaller
        } else if (midVal > key) {
            high = mid - 1; // Neither val is NaN, thisVal is larger
        } else {
            return mid;             // Key found
        }
    }
    return -(low + 1);  // key not found.
}
